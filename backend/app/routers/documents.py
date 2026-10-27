import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user, verify_institute_access
from app.models.schemas import User, UserRole, Application, Document, VerificationStatus, DataAccessLog
from app.core.storage import storage_vault, validate_file_magic_bytes
from app.core.security import generate_signed_document_token, verify_signed_document_token
from app.core.audit import write_audit_event

router = APIRouter(prefix="/documents", tags=["Encrypted Regulatory Document Vault"])


@router.post("/upload")
async def upload_document(
    application_id: str = Form(...),
    document_type: str = Form(..., description="e.g. LAND_TITLE, FIRE_SAFETY_NOC, BUILDING_PLAN, AICTE_EOA"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads document to secure AES-256-GCM encrypted vault:
    - Validates magic bytes (PDF, PNG, JPEG) and file size (<15MB).
    - Computes cryptographic SHA-256 and pHash.
    - Encrypts payload with AES-256-GCM.
    - Stores metadata and writes hash-chained audit event.
    """
    # 1. Check Application
    app_res = db.execute(select(Application).where(Application.id == application_id))
    app_record = app_res.scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    verify_institute_access(current_user, app_record.institute_id)

    # 2. Read content into memory
    content = await file.read()
    try:
        mime = validate_file_magic_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 3. Store encrypted
    storage_meta = storage_vault.store_file(content, file.filename)

    # 4. Create Document DB Record
    doc = Document(
        application_id=application_id,
        doc_type=document_type,
        original_filename=file.filename,
        storage_path_encrypted=storage_meta["storage_path_encrypted"],
        sha256=storage_meta["sha256"],
        phash=storage_meta["phash"],
        size=storage_meta["size"],
        mime=mime,
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.flush()

    # 5. Hash-chained audit event
    write_audit_event(
        session=db,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="DOCUMENT_UPLOADED_ENCRYPTED",
        entity="documents",
        entity_id=doc.id,
        details={
            "application_id": application_id,
            "filename": file.filename,
            "sha256": storage_meta["sha256"],
            "document_type": document_type
        }
    )
    db.commit()

    return {
        "status": "success",
        "document_id": doc.id,
        "original_filename": file.filename,
        "sha256": storage_meta["sha256"],
        "phash": storage_meta["phash"],
        "encrypted_vault_path": storage_meta["storage_path_encrypted"],
        "mime_type": mime,
        "file_size_bytes": storage_meta["size"]
    }


@router.post("/{document_id}/signed-url")
def generate_view_token(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a 5-minute cryptographic HMAC signed viewing token for decrypting in memory.
    """
    stmt = select(Document).where(Document.id == document_id)
    res = db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Check access permission through Application
    app_res = db.execute(select(Application).where(Application.id == doc.application_id))
    app_record = app_res.scalar_one_or_none()
    if app_record:
        verify_institute_access(current_user, app_record.institute_id)

    token = generate_signed_document_token(doc.id, current_user.id, expiry_minutes=5)
    return {
        "signed_token": token,
        "view_url": f"/api/v1/documents/{doc.id}/view?token={token}&user_id={current_user.id}",
        "expires_in_minutes": 5
    }


@router.get("/{document_id}/view")
def view_document_decrypted(
    document_id: str,
    token: str = Query(..., description="Short-lived HMAC signed token"),
    user_id: str = Query(..., description="Requesting User ID"),
    db: Session = Depends(get_db)
):
    """
    Decrypts document strictly IN-MEMORY and streams to caller.
    Validates HMAC signature and 5-minute expiry. Never writes decrypted bytes to disk.
    """
    if not verify_signed_document_token(document_id, user_id, token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Signed document URL is invalid, tampered, or has expired."
        )

    stmt = select(Document).where(Document.id == document_id)
    res = db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    try:
        decrypted_bytes = storage_vault.read_file_decrypted_in_memory(doc.storage_path_encrypted)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")

    # Log data access
    access_log = DataAccessLog(
        user_id=user_id,
        document_id=doc.id,
        purpose="OFFICIAL_VERIFICATION_VIEW"
    )
    db.add(access_log)
    db.commit()

    return Response(
        content=decrypted_bytes,
        media_type=doc.mime,
        headers={
            "Content-Disposition": f"inline; filename={doc.original_filename}",
            "X-Content-Type-Options": "nosniff"
        }
    )
