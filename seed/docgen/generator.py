"""
SATYAPAN - Synthetic Document & Demo Pack Generator (Prompt B1)
Produces realistic government-style certificates, affidavits, NOCs, receipts, and lab photos
with HMAC-signed QR codes, seals, signatures, and injected forensic anomalies.
"""

import os
import sys
import json
import random
import hashlib
import hmac
import csv
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cv2
import numpy as np
import qrcode
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
RANDOM_SEED = 20260228
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

HMAC_SECRET_KEY = b"SATYAPAN_REGULATORY_HMAC_SECRET_2026"
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOCS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "docs"))
DEMO_PACK_DIR = os.path.join(BASE_DIR, "demo_pack")
GENERATED_DIR = os.path.join(BASE_DIR, "generated_docs")
LABELS_FILE = os.path.join(BASE_DIR, "labels.csv")

os.makedirs(DEMO_PACK_DIR, exist_ok=True)
os.makedirs(GENERATED_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)


def compute_qr_hmac(payload: Dict[str, Any], key: bytes = HMAC_SECRET_KEY) -> str:
    """Computes SHA-256 HMAC over canonical JSON string."""
    canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    return hmac.new(key, canonical.encode('utf-8'), hashlib.sha256).hexdigest()


def generate_qr_image(payload: Dict[str, Any], tamper_hmac: bool = False) -> Image.Image:
    """Generates a QR code image with HMAC signed payload."""
    sig = compute_qr_hmac(payload)
    if tamper_hmac:
        # Corrupt the HMAC signature
        sig = sig[:8] + "deadbeef" + sig[16:]
    payload_with_sig = {**payload, "hmac_sha256": sig}
    qr_data = json.dumps(payload_with_sig, separators=(',', ':'))

    qr = qrcode.QRCode(
        version=3,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=2
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB")


def create_round_seal(text_top: str = "STATE REGULATORY AUTHORITY",
                      text_bottom: str = "GOVERNMENT OF MAHARASHTRA",
                      subtext: str = "OFFICIAL SEAL",
                      size: int = 140,
                      color: str = "#1F3A93") -> Image.Image:
    """Creates a high-resolution circular official rubber stamp with concentric borders."""
    seal = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(seal)

    # Outer and inner rings
    draw.ellipse([4, 4, size - 4, size - 4], outline=color, width=3)
    draw.ellipse([12, 12, size - 12, size - 12], outline=color, width=1)
    draw.ellipse([26, 26, size - 26, size - 26], outline=color, width=2)

    # Star decorations
    cx, cy = size // 2, size // 2
    draw.text((16, cy - 6), "★", fill=color)
    draw.text((size - 24, cy - 6), "★", fill=color)

    # Centre text
    draw.text((cx - 38, cy - 12), subtext, fill=color)
    draw.text((cx - 24, cy + 4), "APPROVED", fill=color)

    # Top and bottom text hints
    draw.text((cx - 44, 15), text_top[:14], fill=color)
    draw.text((cx - 40, size - 25), text_bottom[:14], fill=color)

    return seal


def create_signature_image(signer_name: str = "Dr. R. K. Sharma", size: Tuple[int, int] = (160, 50)) -> Image.Image:
    """Creates a realistic cursive signature snippet."""
    sig_img = Image.new("RGBA", size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(sig_img)

    # Draw fluid spline-like signature lines
    points = [
        (10, 35), (25, 12), (38, 42), (55, 18), (70, 38),
        (90, 20), (110, 32), (135, 15), (150, 28)
    ]
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill="#0A2540", width=2)
    # Pen underline flick
    draw.line([(20, 42), (145, 40)], fill="#0A2540", width=2)
    return sig_img


def build_pdf_document(filepath: str,
                       doc_type: str,
                       ref_no: str,
                       inst_name: str,
                       inst_id: str,
                       issue_date: str,
                       expiry_date: str,
                       signer_name: str,
                       signer_desig: str,
                       payload: Dict[str, Any],
                       tamper_qr: bool = False,
                       tamper_date: bool = False,
                       tamper_seal: bool = False,
                       is_hindi: bool = False) -> None:
    """Generates a professional government-standard PDF document with ReportLab."""
    c = canvas.Canvas(filepath, pagesize=A4)
    w, h = A4

    # Outer security double-border
    c.setStrokeColor(colors.HexColor("#1F3A93"))
    c.setLineWidth(2.5)
    c.rect(25, 25, w - 50, h - 50)
    c.setLineWidth(0.8)
    c.rect(29, 29, w - 58, h - 58)

    # National Header Banner
    c.setFillColor(colors.HexColor("#FF9933"))
    c.rect(30, h - 65, w - 60, 32, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 12)
    title_header = "भारत सरकार • GOVERNMENT OF INDIA • REGULATORY ARCHIVE"
    c.drawCentredString(w / 2, h - 50, title_header)

    # Document Header Title
    c.setFillColor(colors.HexColor("#1F3A93"))
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(w / 2, h - 105, doc_type.upper())

    if is_hindi:
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.HexColor("#555555"))
        c.drawCentredString(w / 2, h - 120, "संस्थान अनुमोदन एवं सत्यापन प्रमाणपत्र • APH 2026-27")

    # Document Reference & Dates
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#1A202C"))
    c.drawString(50, h - 150, f"Certificate Ref No: {ref_no}")
    c.drawString(w - 220, h - 150, f"Issued Date: {issue_date}")
    
    # Injected Tamper: Date alteration overlay
    if tamper_date:
        c.drawString(w - 220, h - 165, "Validity Upto: ")
        c.setFillColor(colors.HexColor("#B91C1C"))
        c.setFont("Helvetica-Bold", 11)
        c.drawString(w - 145, h - 165, "31/12/2035")
    else:
        c.drawString(w - 220, h - 165, f"Validity Upto: {expiry_date}")

    c.setStrokeColor(colors.HexColor("#E2E8F0"))
    c.line(50, h - 180, w - 50, h - 180)

    # Institutional Identity & Details
    c.setFont("Helvetica", 11)
    c.setFillColor(colors.HexColor("#2D3748"))
    c.drawString(50, h - 210, f"This is to certify that regulatory scrutiny has been conducted for:")
    
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(colors.HexColor("#1F3A93"))
    c.drawString(50, h - 232, inst_name)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#4A5568"))
    c.drawString(50, h - 252, f"AICTE Permanent Institute ID: {inst_id}")

    # Official Body Content
    c.setFont("Helvetica", 10.5)
    body_lines = [
        "1. The institution satisfies the statutory space, fire safety, and environmental protection norms.",
        "2. Built-up instructional and administrative carpet area meets the approved threshold of 10,450 sq.m.",
        "3. Faculty-to-Student Ratio (FSR) is maintained at 1:15 against the mandated national norm of 1:20.",
        "4. All biometric and documentary signatures conform to the Public Key Infrastructure (PKI) standards.",
        "5. Any tampering, unauthorized duplication, or alteration invalidates this instrument ipso facto."
    ]
    y_pos = h - 290
    for line in body_lines:
        c.drawString(50, y_pos, line)
        y_pos -= 22

    # QR Code Generation & Embedding
    qr_img = generate_qr_image(payload, tamper_hmac=tamper_qr)
    qr_temp_path = filepath.replace(".pdf", "_qr.png")
    qr_img.save(qr_temp_path)
    c.drawImage(qr_temp_path, 50, 50, width=110, height=110)
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#718096"))
    c.drawString(50, 40, "Scan to verify HMAC Authenticity")

    # Round Rubber Stamp / Seal
    seal_img = create_round_seal(size=140)
    seal_temp_path = filepath.replace(".pdf", "_seal.png")
    seal_img.save(seal_temp_path)
    c.drawImage(seal_temp_path, w / 2 - 45, 45, width=90, height=90, mask='auto')

    # Signature & Signer Block
    sig_img = create_signature_image(signer_name)
    sig_temp_path = filepath.replace(".pdf", "_sig.png")
    sig_img.save(sig_temp_path)
    c.drawImage(sig_temp_path, w - 190, 85, width=130, height=40, mask='auto')

    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#1A202C"))
    c.drawRightString(w - 50, 75, signer_name)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#4A5568"))
    c.drawRightString(w - 50, 60, signer_desig)
    c.drawRightString(w - 50, 46, "Designated Verification Authority")

    c.save()

    # Clean up temporary raster artifacts
    for p in [qr_temp_path, seal_temp_path, sig_temp_path]:
        if os.path.exists(p):
            os.remove(p)


def generate_png_document(filepath: str,
                          doc_type: str,
                          ref_no: str,
                          inst_name: str,
                          inst_id: str,
                          issue_date: str,
                          expiry_date: str,
                          signer_name: str,
                          signer_desig: str,
                          payload: Dict[str, Any],
                          copy_move_seal: bool = False) -> None:
    """Generates an image-based synthetic deed / certificate with optional copy-move artifact."""
    img = Image.new("RGB", (1200, 1600), "#FDFBF7")
    draw = ImageDraw.Draw(img)

    # Double border
    draw.rectangle([30, 30, 1170, 1570], outline="#1F3A93", width=4)
    draw.rectangle([40, 40, 1160, 1560], outline="#1F3A93", width=2)

    # Header
    draw.rectangle([40, 40, 1160, 140], fill="#1F3A93")
    draw.text((360, 75), doc_type.upper(), fill="#FFFFFF", font=None)

    # Body text
    y = 220
    draw.text((80, y), f"INSTRUMENT REFERENCE: {ref_no}", fill="#1A202C")
    draw.text((80, y + 40), f"INSTITUTION: {inst_name} (ID: {inst_id})", fill="#1F3A93")
    draw.text((80, y + 80), f"ISSUE DATE: {issue_date}   |   VALIDITY: {expiry_date}", fill="#4A5568")

    y += 160
    draw.line([80, y, 1120, y], fill="#CBD5E1", width=2)
    y += 40

    clauses = [
        "1. This registered deed affirms physical title of educational land measuring 5.25 acres.",
        "2. Encumbrance-free occupancy verified against revenue records in Pune district, Maharashtra.",
        "3. Building permission reference BP/2024/774 conforms to municipal bylaws.",
        "4. This digital ledger record is cryptographically indexed in the SATYAPAN national vault."
    ]
    for clause in clauses:
        draw.text((80, y), clause, fill="#2D3748")
        y += 45

    # Paste QR Code
    qr_img = generate_qr_image(payload)
    img.paste(qr_img.resize((180, 180)), (100, 1300))

    # Paste Authentic Seal
    seal_img = create_round_seal(size=200).convert("RGBA")
    img.paste(seal_img, (500, 1300), seal_img)

    # Injected Tamper: Copy-Move duplication of the seal
    if copy_move_seal:
        # Clone the seal and paste it onto another region with slight offset
        img.paste(seal_img, (850, 1050), seal_img)

    # Signature
    sig_img = create_signature_image(signer_name, size=(240, 80)).convert("RGBA")
    img.paste(sig_img, (850, 1360), sig_img)
    draw.text((850, 1450), signer_name, fill="#1A202C")
    draw.text((850, 1480), signer_desig, fill="#4A5568")

    img.save(filepath, "PNG")


def generate_infrastructure_photo(filepath: str, label: str, quality_flag: str = "good") -> None:
    """Generates synthetic high-resolution institutional infrastructure proof photos."""
    img = Image.new("RGB", (1024, 768), "#2A3B4C")
    draw = ImageDraw.Draw(img)

    # Floor & walls simulation
    draw.rectangle([0, 480, 1024, 768], fill="#3D4E5F")
    for x in range(0, 1024, 80):
        draw.line([x, 480, x - 40, 768], fill="#516478", width=2)

    # Lab benches & computer screens / equipment
    for bx in [120, 420, 720]:
        draw.rectangle([bx, 380, bx + 220, 500], fill="#8D9CAE", outline="#CBD5E1", width=3)
        # Monitor
        draw.rectangle([bx + 60, 260, bx + 160, 370], fill="#0F172A", outline="#94A3B8", width=2)
        draw.rectangle([bx + 95, 370, bx + 125, 385], fill="#64748B")

    # Watermark / Camera timestamp
    draw.rectangle([20, 20, 440, 70], fill="#0F172A")
    draw.text((35, 30), f"EVIDENCE: {label.upper()}", fill="#FF9933")
    draw.text((35, 48), "GEO: 18.5204 N, 73.8567 E • 2026-02-18 11:24:00 IST", fill="#FFFFFF")

    if quality_flag == "blurry":
        # Apply heavy Gaussian blur to trigger low-quality/resubmission flag
        img = img.filter(ImageFilter.GaussianBlur(radius=8.5))
    elif quality_flag == "inconsistent":
        # Introduce illumination / foreign region patch mismatch
        draw.rectangle([700, 200, 950, 450], fill="#8A9BA8")

    img.save(filepath, "JPEG", quality=90)


def build_curated_demo_pack() -> List[Dict[str, Any]]:
    """Builds the 12 Stage-Rehearsal Demo Pack documents with fixed ground truths."""
    demo_records = []
    
    # 1. fire_noc_clean.pdf
    fn1 = "fire_noc_clean.pdf"
    fp1 = os.path.join(DEMO_PACK_DIR, fn1)
    p1 = {
        "doc_type": "Fire Safety NOC",
        "ref": "NOC-FIRE-2025-9921",
        "inst_id": "AICTE-1-3324901",
        "issue_date": "2025-04-10",
        "expiry_date": "2028-04-09",
        "signer": "Dr. R. K. Sharma",
        "authority": "FIRE_DEPT",
        "status": "VALID"
    }
    build_pdf_document(
        fp1, "Fire Safety NOC", p1["ref"], "Saraswati Institute of Technology",
        p1["inst_id"], p1["issue_date"], p1["expiry_date"], p1["signer"],
        "Chief Fire Officer, Pune Municipal", p1
    )
    demo_records.append({
        "filename": fn1,
        "doc_type": "Fire NOC",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2025-04-10",
        "expiry_date": "2028-04-09",
        "is_clean": True,
        "anomaly_type": "NONE",
        "expected_verdict": "VERIFIED",
        "notes": "Verified, no findings"
    })

    # 2. naac_certificate_expired.pdf
    fn2 = "naac_certificate_expired.pdf"
    fp2 = os.path.join(DEMO_PACK_DIR, fn2)
    p2 = {
        "doc_type": "NAAC Accreditation",
        "ref": "NAAC-MH-COA-2019-4401",
        "inst_id": "AICTE-1-3324901",
        "issue_date": "2019-01-15",
        "expiry_date": "2024-01-14",
        "signer": "Prof. S. C. Sharma",
        "authority": "NAAC",
        "status": "EXPIRED"
    }
    build_pdf_document(
        fp2, "NAAC Accreditation Certificate", p2["ref"], "Saraswati Institute of Technology",
        p2["inst_id"], p2["issue_date"], p2["expiry_date"], p2["signer"],
        "Director, NAAC Council", p2
    )
    demo_records.append({
        "filename": fn2,
        "doc_type": "NAAC Accreditation",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2019-01-15",
        "expiry_date": "2024-01-14",
        "is_clean": False,
        "anomaly_type": "EXPIRED_DATE",
        "expected_verdict": "EXPIRED",
        "notes": "Expired, HIGH finding"
    })

    # 3. affidavit_tampered_date.pdf
    fn3 = "affidavit_tampered_date.pdf"
    fp3 = os.path.join(DEMO_PACK_DIR, fn3)
    p3 = {
        "doc_type": "Anti-Ragging Affidavit",
        "ref": "AFF-NOTARY-2025-1104",
        "inst_id": "AICTE-1-3324901",
        "issue_date": "2025-06-01",
        "expiry_date": "2026-05-31",
        "signer": "Adv. Mohan V. Joshi",
        "authority": "NOTARY",
        "status": "VALID"
    }
    build_pdf_document(
        fp3, "Anti-Ragging Affidavit & Land Undertaking", p3["ref"], "Saraswati Institute of Technology",
        p3["inst_id"], p3["issue_date"], p3["expiry_date"], p3["signer"],
        "Advocate & Notary Public", p3, tamper_date=True
    )
    demo_records.append({
        "filename": fn3,
        "doc_type": "Affidavit",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2025-06-01",
        "expiry_date": "2035-12-31",
        "is_clean": False,
        "anomaly_type": "TAMPERED_TEXT",
        "expected_verdict": "TAMPER_SUSPECTED",
        "notes": "Tampered date field with ELA noise disparity"
    })

    # 4. trust_deed_copy_move_seal.png
    fn4 = "trust_deed_copy_move_seal.png"
    fp4 = os.path.join(DEMO_PACK_DIR, fn4)
    p4 = {
        "doc_type": "Trust Registration Deed",
        "ref": "TR-CHARITY-PUNE-883",
        "inst_id": "AICTE-1-3324901",
        "issue_date": "2018-03-20",
        "expiry_date": "PERPETUAL",
        "signer": "V. K. Patwardhan",
        "authority": "TRUST_REGISTRAR",
        "status": "VALID"
    }
    generate_png_document(
        fp4, "Trust Registration Deed & Charter", p4["ref"], "Saraswati Education Society",
        p4["inst_id"], p4["issue_date"], p4["expiry_date"], p4["signer"],
        "Joint Charity Commissioner", p4, copy_move_seal=True
    )
    demo_records.append({
        "filename": fn4,
        "doc_type": "Trust Deed",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2018-03-20",
        "expiry_date": "PERPETUAL",
        "is_clean": False,
        "anomaly_type": "COPY_MOVE_SEAL",
        "expected_verdict": "TAMPER_SUSPECTED",
        "notes": "Copy-move on the seal detected by ORB feature match"
    })

    # 5. building_plan_duplicate.pdf
    fn5 = "building_plan_duplicate.pdf"
    fp5 = os.path.join(DEMO_PACK_DIR, fn5)
    p5 = {
        "doc_type": "Building Plan Approval",
        "ref": "BP-MUNICIPAL-2023-8812",
        "inst_id": "AICTE-1-4991202",  # Mismatched institute
        "issue_date": "2023-08-11",
        "expiry_date": "2028-08-10",
        "signer": "Chief Town Planner",
        "authority": "MUNICIPAL",
        "status": "VALID"
    }
    build_pdf_document(
        fp5, "Building Plan Approval & Occupancy Certificate", p5["ref"],
        "Modern Technical Campus (Cross-Uploaded)", p5["inst_id"],
        p5["issue_date"], p5["expiry_date"], p5["signer"],
        "Town Planning Officer", p5
    )
    demo_records.append({
        "filename": fn5,
        "doc_type": "Building Plan",
        "institute_id": "AICTE-1-4991202",
        "issue_date": "2023-08-11",
        "expiry_date": "2028-08-10",
        "is_clean": False,
        "anomaly_type": "DUPLICATE_CROSS_INSTITUTE",
        "expected_verdict": "DUPLICATE",
        "notes": "Matches document of another institute via pHash"
    })

    # 6. university_letter_bad_qr.pdf
    fn6 = "university_letter_bad_qr.pdf"
    fp6 = os.path.join(DEMO_PACK_DIR, fn6)
    p6 = {
        "doc_type": "University Affiliation Letter",
        "ref": "SPPU-AFFIL-2025-401",
        "inst_id": "AICTE-1-3324901",
        "issue_date": "2025-05-15",
        "expiry_date": "2026-05-14",
        "signer": "Registrar, SPPU Pune",
        "authority": "UNIVERSITY",
        "status": "VALID"
    }
    build_pdf_document(
        fp6, "University Affiliation Letter", p6["ref"], "Saraswati Institute of Technology",
        p6["inst_id"], p6["issue_date"], p6["expiry_date"], p6["signer"],
        "Registrar, Savitribai Phule Pune University", p6, tamper_qr=True
    )
    demo_records.append({
        "filename": fn6,
        "doc_type": "Affiliation Letter",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2025-05-15",
        "expiry_date": "2026-05-14",
        "is_clean": False,
        "anomaly_type": "BAD_QR_HMAC",
        "expected_verdict": "SIGNATURE_INVALID",
        "notes": "HMAC fails signature integrity check"
    })

    # 7. appointment_letter_untrusted.pdf
    fn7 = "appointment_letter_untrusted.pdf"
    fp7 = os.path.join(DEMO_PACK_DIR, fn7)
    p7 = {
        "doc_type": "Faculty Appointment Letter",
        "ref": "APT-FAC-2024-009",
        "inst_id": "AICTE-1-3324901",
        "issue_date": "2024-07-01",
        "expiry_date": "PERPETUAL",
        "signer": "Unknown Third-Party Agency",
        "authority": "UNTRUSTED_ISSUER",
        "status": "UNTRUSTED"
    }
    build_pdf_document(
        fp7, "Faculty Appointment & Service Agreement", p7["ref"], "Saraswati Institute of Technology",
        p7["inst_id"], p7["issue_date"], p7["expiry_date"], p7["signer"],
        "Contract Staffing Agent", p7
    )
    demo_records.append({
        "filename": fn7,
        "doc_type": "Appointment Letter",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2024-07-01",
        "expiry_date": "PERPETUAL",
        "is_clean": False,
        "anomaly_type": "UNTRUSTED_SIGNER",
        "expected_verdict": "SIGNER_NOT_TRUSTED",
        "notes": "Signer not in the institutional trust store"
    })

    # 8. marksheet_clean.pdf
    fn8 = "marksheet_clean.pdf"
    fp8 = os.path.join(DEMO_PACK_DIR, fn8)
    p8 = {
        "doc_type": "Degree Mark Sheet",
        "ref": "DEG-MS-2024-88401",
        "inst_id": "AICTE-1-3324901",
        "issue_date": "2024-06-25",
        "expiry_date": "PERPETUAL",
        "signer": "Controller of Examinations",
        "authority": "STATE_BOARD",
        "status": "VALID"
    }
    build_pdf_document(
        fp8, "Consolidated Degree Mark Sheet", p8["ref"], "Saraswati Institute of Technology",
        p8["inst_id"], p8["issue_date"], p8["expiry_date"], p8["signer"],
        "Controller of Examinations, State University", p8, is_hindi=True
    )
    demo_records.append({
        "filename": fn8,
        "doc_type": "Mark Sheet",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2024-06-25",
        "expiry_date": "PERPETUAL",
        "is_clean": True,
        "anomaly_type": "NONE",
        "expected_verdict": "VERIFIED",
        "notes": "Verified authentic student credential"
    })

    # 9. fee_receipt_id_mismatch.pdf
    fn9 = "fee_receipt_id_mismatch.pdf"
    fp9 = os.path.join(DEMO_PACK_DIR, fn9)
    p9 = {
        "doc_type": "Student Fee Receipt",
        "ref": "RCPT-FEE-2025-10492",
        "inst_id": "AICTE-1-9999999",  # Mismatch ID
        "issue_date": "2025-08-04",
        "expiry_date": "2026-07-31",
        "signer": "Accounts Officer",
        "authority": "ACCOUNTS",
        "status": "VALID"
    }
    build_pdf_document(
        fp9, "Tuition & Laboratory Fee Receipt", p9["ref"], "Unknown Autonomous College",
        p9["inst_id"], p9["issue_date"], p9["expiry_date"], p9["signer"],
        "Accounts Officer", p9
    )
    demo_records.append({
        "filename": fn9,
        "doc_type": "Fee Receipt",
        "institute_id": "AICTE-1-9999999",
        "issue_date": "2025-08-04",
        "expiry_date": "2026-07-31",
        "is_clean": False,
        "anomaly_type": "MISMATCH_INSTITUTE_ID",
        "expected_verdict": "MISMATCH_ID",
        "notes": "Mismatch ID against the active institute record"
    })

    # 10. lab_photo_good.jpg
    fn10 = "lab_photo_good.jpg"
    fp10 = os.path.join(DEMO_PACK_DIR, fn10)
    generate_infrastructure_photo(fp10, "Computer Science & AI Laboratory", quality_flag="good")
    demo_records.append({
        "filename": fn10,
        "doc_type": "Infra Evidence",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2026-02-18",
        "expiry_date": "N/A",
        "is_clean": True,
        "anomaly_type": "NONE",
        "expected_verdict": "VERIFIED",
        "notes": "Infra evidence passes room geometry and sharpness"
    })

    # 11. lab_photo_blurry.jpg
    fn11 = "lab_photo_blurry.jpg"
    fp11 = os.path.join(DEMO_PACK_DIR, fn11)
    generate_infrastructure_photo(fp11, "Physics & Mechanics Laboratory", quality_flag="blurry")
    demo_records.append({
        "filename": fn11,
        "doc_type": "Infra Evidence",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2026-02-18",
        "expiry_date": "N/A",
        "is_clean": False,
        "anomaly_type": "BLUR_DEFICIENCY",
        "expected_verdict": "NEEDS_ADDITIONAL_EVIDENCE",
        "notes": "Needs additional evidence due to high Laplacian blur"
    })

    # 12. library_photo_inconsistent.jpg
    fn12 = "library_photo_inconsistent.jpg"
    fp12 = os.path.join(DEMO_PACK_DIR, fn12)
    generate_infrastructure_photo(fp12, "Central Reading Hall & Digital Library", quality_flag="inconsistent")
    demo_records.append({
        "filename": fn12,
        "doc_type": "Infra Evidence",
        "institute_id": "AICTE-1-3324901",
        "issue_date": "2026-02-18",
        "expiry_date": "N/A",
        "is_clean": False,
        "anomaly_type": "INCONSISTENT_LIGHTING",
        "expected_verdict": "FLAGGED_FOR_INSPECTION",
        "notes": "Flagged for physical scrutiny committee inspection"
    })

    return demo_records


def generate_extended_dataset(total_docs: int = 200) -> List[Dict[str, Any]]:
    """Generates synthetic dataset (~200 files) split into train (70%), val (15%), test (15%)."""
    doc_types = [
        "Affidavit", "Fire NOC", "NAAC Accreditation", "University Affiliation",
        "Land Deed", "Building Plan", "Trust Deed", "Appointment Letter",
        "Fee Receipt", "Mark Sheet", "Caste Certificate", "TER Receipt"
    ]
    institutes = [
        ("AICTE-1-3324901", "Saraswati Institute of Technology"),
        ("AICTE-1-1029481", "Maharashtra College of Engineering"),
        ("AICTE-1-8839201", "Symbiosis Institute of Technology"),
        ("AICTE-1-4491029", "Pune Institute of Computer Technology"),
        ("AICTE-1-7738291", "Dr. D. Y. Patil College of Engineering")
    ]
    signers = [
        ("Dr. R. K. Sharma", "Chief Fire Officer"),
        ("Prof. S. C. Sharma", "Director, Accreditation"),
        ("Adv. Mohan V. Joshi", "Notary Public"),
        ("Dr. Arvind R. Joshi", "Registrar"),
        ("S. K. Kulkarni", "Town Planning Officer")
    ]

    records = []
    for i in range(1, total_docs + 1):
        is_clean = (random.random() < 0.60)
        dtype = random.choice(doc_types)
        inst_id, inst_name = random.choice(institutes)
        signer_name, signer_desig = random.choice(signers)
        ref_no = f"SATYAPAN-DOC-{2025}-{i:04d}"
        
        issue_year = random.choice([2023, 2024, 2025])
        issue_date = f"{issue_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        expiry_date = f"{issue_year + 3}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"

        anomaly_type = "NONE"
        expected_verdict = "VERIFIED"
        tamper_qr = False
        tamper_date = False

        if not is_clean:
            anomaly_choice = random.choice([
                "EXPIRED_DATE", "TAMPERED_TEXT", "BAD_QR_HMAC", "MISMATCH_INSTITUTE_ID"
            ])
            anomaly_type = anomaly_choice
            if anomaly_choice == "EXPIRED_DATE":
                expiry_date = "2024-01-01"
                expected_verdict = "EXPIRED"
            elif anomaly_choice == "TAMPERED_TEXT":
                tamper_date = True
                expected_verdict = "TAMPER_SUSPECTED"
            elif anomaly_choice == "BAD_QR_HMAC":
                tamper_qr = True
                expected_verdict = "SIGNATURE_INVALID"
            elif anomaly_choice == "MISMATCH_INSTITUTE_ID":
                inst_id = "AICTE-1-0000000"
                expected_verdict = "MISMATCH_ID"

        filename = f"doc_{i:04d}_{dtype.lower().replace(' ', '_')}.pdf"
        filepath = os.path.join(GENERATED_DIR, filename)

        payload = {
            "doc_type": dtype,
            "ref": ref_no,
            "inst_id": inst_id,
            "issue_date": issue_date,
            "expiry_date": expiry_date,
            "signer": signer_name,
            "authority": "STATE_AUTHORITY"
        }

        # Deterministic Train/Val/Test split
        rnd_split = random.random()
        if rnd_split < 0.70:
            split = "train"
        elif rnd_split < 0.85:
            split = "val"
        else:
            split = "test"

        # Generate actual PDF file
        build_pdf_document(
            filepath, dtype, ref_no, inst_name, inst_id,
            issue_date, expiry_date, signer_name, signer_desig,
            payload, tamper_qr=tamper_qr, tamper_date=tamper_date
        )

        records.append({
            "filename": filename,
            "doc_type": dtype,
            "institute_id": inst_id,
            "issue_date": issue_date,
            "expiry_date": expiry_date,
            "is_clean": is_clean,
            "anomaly_type": anomaly_type,
            "expected_verdict": expected_verdict,
            "split": split,
            "notes": f"Synthetic benchmark sample {i}"
        })

    return records


def write_demo_pack_documentation(demo_records: List[Dict[str, Any]]) -> None:
    """Creates /docs/DEMO_PACK.md for stage demo rehearsals."""
    md_path = os.path.join(DOCS_DIR, "DEMO_PACK.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# SATYAPAN - Stage Evaluation Demo Pack\n\n")
        f.write("This document provides the canonical rehearsal script and ground-truth expected outcomes for the 12 fixed evaluation documents in `/seed/demo_pack/`.\n\n")
        f.write("| # | File Name | Document Type | What to Say on Stage | Expected AI Verdict | Technical Anomaly Triggered |\n")
        f.write("|---|-----------|---------------|----------------------|----------------------|----------------------------|\n")
        
        for idx, r in enumerate(demo_records, start=1):
            f.write(f"| **{idx}** | `{r['filename']}` | {r['doc_type']} | {r['notes']} | **{r['expected_verdict']}** | `{r['anomaly_type']}` |\n")

        f.write("\n---\n\n")
        f.write("### Verification Acceptance Criteria\n")
        f.write("1. All files generate deterministically using `RANDOM_SEED = 20260228`.\n")
        f.write("2. Ground-truth verdicts in `/seed/labels.csv` exactly match this table.\n")
        f.write("3. The Document Scan View (`<ScanView/>`) displays the identical forensic report and advisory banner.\n")


def main():
    print("=" * 70)
    print("   SATYAPAN - SYNTHETIC DOCUMENT & DEMO PACK GENERATOR (PROMPT B1)")
    print("=" * 70)

    # 1. Generate the 12 Stage Demo Pack files
    print("\n[*] Generating 12 Curated Demo Pack Documents in /seed/demo_pack/ ...")
    demo_records = build_curated_demo_pack()
    for r in demo_records:
        r["split"] = "demo_stage"
        print(f"  [OK] Created: {r['filename']:<34} Verdict: {r['expected_verdict']}")

    # 2. Write /docs/DEMO_PACK.md
    print("\n[*] Writing Demo Pack Documentation in /docs/DEMO_PACK.md ...")
    write_demo_pack_documentation(demo_records)
    print("  [OK] /docs/DEMO_PACK.md successfully written.")

    # 3. Generate Extended Dataset (~100 sample documents for ML training & eval)
    print("\n[*] Generating Synthetic Benchmark Dataset in /seed/generated_docs/ ...")
    extended_records = generate_extended_dataset(total_docs=80)
    print(f"  [OK] Created {len(extended_records)} synthetic PDF benchmark files.")

    # 4. Write Ground Truth /seed/labels.csv
    all_records = demo_records + extended_records
    print(f"\n[*] Writing Ground-Truth Catalogue in {LABELS_FILE} ...")
    fieldnames = [
        "filename", "doc_type", "institute_id", "issue_date", "expiry_date",
        "is_clean", "anomaly_type", "expected_verdict", "split", "notes"
    ]
    with open(LABELS_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)
    
    print(f"  [OK] {len(all_records)} ground-truth records written to labels.csv.")
    print("\n[OK] PROMPT B1 GENERATOR COMPLETED SUCCESSFULLY!")


if __name__ == "__main__":
    main()
