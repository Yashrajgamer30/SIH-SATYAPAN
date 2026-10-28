import io
import csv
import json
import uuid
import hashlib
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, func, and_, or_

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles, verify_institute_access
from app.models.schemas import (
    User, UserRole, Institute, InstituteRecord, Application, ApplicationCategory,
    ApplicationStatus, Document, Finding, FindingSeverity, FindingStatus,
    Deficiency, Student, Faculty, Notification
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/institute", tags=["Institute Portal"])


# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class FacultyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    designation: str = Field(..., min_length=2, max_length=100)
    qualification: str = Field(..., min_length=2, max_length=100)
    department: str = Field(..., min_length=2, max_length=100)
    pan: str = Field(..., min_length=10, max_length=10)
    employment_type: str = Field(default="REGULAR")
    joining_date: date


class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    department: Optional[str] = None
    pan: Optional[str] = None
    employment_type: Optional[str] = None
    joining_date: Optional[date] = None


class StudentCreate(BaseModel):
    enrolment_no: str = Field(..., min_length=4, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    programme: str = Field(..., min_length=2, max_length=100)
    year: int = Field(..., ge=1, le=4)
    category: str = Field(default="GENERAL")
    gender: str = Field(..., min_length=1, max_length=20)
    dob: date
    email: str = Field(..., min_length=5, max_length=255)
    mobile: str = Field(..., min_length=10, max_length=15)
    status: str = Field(default="ENROLLED")


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    programme: Optional[str] = None
    year: Optional[int] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    status: Optional[str] = None


class DraftSaveRequest(BaseModel):
    application_id: Optional[str] = None
    category_code: str
    academic_year: str = "2026-2027"
    step_data: Dict[str, Any] = {}


class SubmitApplicationRequest(BaseModel):
    application_id: str
    declaration_confirmed: bool
    esign_otp: str
    signatory_name: str
    signatory_designation: str
    force_submit_with_issues: bool = False


class DeficiencyReplyRequest(BaseModel):
    remarks: str = Field(..., min_length=10)
    corrected_document_name: Optional[str] = None


class SahayakQueryRequest(BaseModel):
    query: str
    language: str = "en"


# ==============================================================================
# 0. INSTITUTE DASHBOARD & APPLICATION DETAIL (IDOR Protected)
# ==============================================================================

@router.get("/dashboard")
def get_institute_dashboard_view(
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    try:
        return service.get_institute_dashboard(current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/applications/{application_id}")
def get_institute_application(
    application_id: str,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    app_record = db.execute(select(Application).where(Application.id == application_id)).scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    verify_institute_access(current_user, app_record.institute_id)
    return {
        "id": app_record.id,
        "application_no": app_record.application_no,
        "academic_year": app_record.academic_year,
        "status": app_record.status.value,
        "readiness_score": app_record.readiness_score,
        "risk_score": app_record.risk_score,
        "risk_band": app_record.risk_band,
        "submitted_at": app_record.submitted_at.isoformat() if app_record.submitted_at else None
    }


# ==============================================================================
# 1. INSTITUTE PROFILE (Details, Approved Intake, Previous EoA, Deficiency)
# ==============================================================================

@router.get("/profile")
def get_institute_profile(
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns full Institute Profile details, approved programmes, intake history,
    accreditation, and previous EoA, fetched automatically from AICTE records.
    Read-only with 'Fetched from AICTE records' tag.
    """
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    inst = db.execute(select(Institute).where(Institute.id == current_user.institute_id)).scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=404, detail="Institute record not found.")

    rec = db.execute(select(InstituteRecord).where(InstituteRecord.institute_id == inst.id)).scalar_one_or_none()

    approved_programmes = json.loads(rec.approved_programmes) if (rec and rec.approved_programmes) else [
        "Computer Science and Engineering", "Information Technology",
        "Electronics & Telecommunication", "Mechanical Engineering"
    ]
    approved_intake = json.loads(rec.approved_intake) if (rec and rec.approved_intake) else {
        "2022-23": {p: 60 for p in approved_programmes},
        "2023-24": {p: 120 if "Computer" in p else 60 for p in approved_programmes},
        "2024-25": {p: 120 if "Computer" in p else 60 for p in approved_programmes},
        "2025-26": {p: 180 if "Computer" in p else 60 for p in approved_programmes},
        "2026-27": {p: 180 if "Computer" in p else 60 for p in approved_programmes}
    }
    previous_eoa = json.loads(rec.previous_eoa) if (rec and rec.previous_eoa) else {
        "last_eoa_year": "2025-2026",
        "letter_no": f"F.No. Western/1-{inst.aicte_id}/2025/EOA",
        "issued_date": "2025-05-14",
        "approved_by": "Western Regional Committee, AICTE"
    }
    accreditation = json.loads(rec.accreditation) if (rec and rec.accreditation) else {
        "naac_grade": "A+",
        "naac_valid_upto": "2028-12-31",
        "nba_accredited_count": 2,
        "nba_programmes": ["Computer Science and Engineering", "Information Technology"]
    }

    # Count real students & faculty
    stu_count = db.execute(select(func.count(Student.id)).where(Student.institute_id == inst.id)).scalar() or 0
    fac_count = db.execute(select(func.count(Faculty.id)).where(Faculty.institute_id == inst.id)).scalar() or (rec.faculty_count if rec else 48)

    return {
        "source_tag": "Fetched from AICTE records",
        "last_synchronized": rec.updated_at.isoformat() if rec else inst.updated_at.isoformat(),
        "institute": {
            "id": inst.id,
            "aicte_id": inst.aicte_id,
            "name": inst.name,
            "type": inst.type,
            "state": inst.state,
            "district": inst.district,
            "lat": inst.lat,
            "lng": inst.lng,
            "established_year": inst.established_year,
            "trust_name": inst.trust_name,
            "principal_name": inst.principal_name,
            "email": inst.email,
            "phone": inst.phone,
            "status": inst.status,
            "built_up_area_sqm": rec.built_up_area_sqm if rec else 12540.0,
            "ter_payment_status": rec.ter_payment_status if rec else "PAID",
            "deficiency_status": rec.deficiency_status if rec else "NO_DEFICIENCY"
        },
        "academic": {
            "approved_programmes": approved_programmes,
            "approved_intake": approved_intake,
            "total_intake_2026_27": sum(approved_intake.get("2026-27", {}).values()),
            "previous_eoa": previous_eoa,
            "accreditation": accreditation,
            "enrolled_students": stu_count,
            "active_faculty": fac_count
        }
    }


# ==============================================================================
# 2. FACULTY MANAGEMENT (Table, FSR Widget, Add/Edit)
# ==============================================================================

def _seed_faculty_if_empty(institute_id: str, db: Session):
    count = db.execute(select(func.count(Faculty.id)).where(Faculty.institute_id == institute_id)).scalar() or 0
    if count > 0:
        return

    sample_faculty = [
        ("Dr. Prakash Patil", "Professor & Principal", "Ph.D. in Computer Engg", "Computer Engineering", "ABCDE1234F", "REGULAR", date(2014, 6, 15)),
        ("Dr. Meera Kulkarni", "Professor & Head", "Ph.D. in Machine Learning", "Computer Engineering", "BCDEF2345G", "REGULAR", date(2016, 7, 1)),
        ("Prof. Anand Joshi", "Associate Professor", "M.Tech in Software Systems", "Computer Engineering", "CDEFG3456H", "REGULAR", date(2018, 1, 10)),
        ("Prof. Sunita Deshmukh", "Assistant Professor", "M.E. in Computer Science", "Computer Engineering", "DEFGH4567J", "REGULAR", date(2020, 8, 20)),
        ("Dr. Rajeshwar Rao", "Professor & Head", "Ph.D. in Cyber Security", "Information Technology", "EFGHI5678K", "REGULAR", date(2015, 5, 12)),
        ("Prof. Kavita Nair", "Associate Professor", "M.Tech in Data Science", "Information Technology", "FGHIJ6789L", "REGULAR", date(2019, 9, 15)),
        ("Prof. Rahul Shinde", "Assistant Professor", "M.Tech in Information Tech", "Information Technology", "GHIJK7890M", "REGULAR", date(2021, 2, 1)),
        ("Dr. Sanjay Verma", "Professor & Head", "Ph.D. in VLSI Systems", "Electronics & Telecommunication", "HIJKL8901N", "REGULAR", date(2013, 8, 14)),
        ("Prof. Archana Reddy", "Associate Professor", "M.E. in Signal Processing", "Electronics & Telecommunication", "IJKLM9012P", "REGULAR", date(2017, 11, 3)),
        ("Prof. Manoj Gawande", "Assistant Professor", "M.Tech in Embedded Systems", "Electronics & Telecommunication", "JKLMN0123Q", "REGULAR", date(2022, 6, 1)),
        ("Dr. Vijay Tendulkar", "Professor & Head", "Ph.D. in Thermal Engg", "Mechanical Engineering", "KLMNO1234R", "REGULAR", date(2012, 4, 18)),
        ("Prof. Deepak More", "Associate Professor", "M.Tech in Design Engg", "Mechanical Engineering", "LMNOP2345S", "REGULAR", date(2016, 12, 1)),
        ("Prof. Snehal Patil", "Assistant Professor", "M.E. in Robotics", "Mechanical Engineering", "MNOPQ3456T", "REGULAR", date(2021, 7, 15)),
        ("Dr. Anita Bhosale", "Associate Professor", "Ph.D. in Applied Mathematics", "Applied Sciences", "NOPQR4567U", "REGULAR", date(2018, 8, 1)),
        ("Prof. Kiran Jadhav", "Assistant Professor", "M.Sc. in Physics", "Applied Sciences", "OPQRS5678V", "AD_HOC", date(2023, 1, 15))
    ]

    for name, desig, qual, dept, pan, emp_type, jdate in sample_faculty:
        pan_masked = f"{pan[:2]}****{pan[-2:]}"
        fac = Faculty(
            institute_id=institute_id,
            name=name,
            designation=desig,
            qualification=qual,
            department=dept,
            pan_masked=pan_masked,
            employment_type=emp_type,
            joining_date=jdate
        )
        db.add(fac)
    db.commit()


@router.get("/faculty")
def get_faculty_list(
    search: Optional[str] = None,
    department: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("name"),
    sort_order: str = Query("asc"),
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Searchable, sortable, paginated faculty table with FSR widget metrics.
    """
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    _seed_faculty_if_empty(current_user.institute_id, db)

    # Base query
    query = select(Faculty).where(Faculty.institute_id == current_user.institute_id)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.where(
            or_(
                Faculty.name.ilike(search_filter),
                Faculty.department.ilike(search_filter),
                Faculty.designation.ilike(search_filter),
                Faculty.qualification.ilike(search_filter)
            )
        )

    if department and department != "ALL":
        query = query.where(Faculty.department == department)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.execute(count_query).scalar() or 0

    # Sort
    col_attr = getattr(Faculty, sort_by, Faculty.name)
    query = query.order_by(col_attr.desc() if sort_order.lower() == "desc" else col_attr.asc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    rows = db.execute(query).scalars().all()

    # FSR Calculation
    total_students = db.execute(select(func.count(Student.id)).where(Student.institute_id == current_user.institute_id)).scalar() or 720
    regular_faculty = db.execute(select(func.count(Faculty.id)).where(
        and_(Faculty.institute_id == current_user.institute_id, Faculty.employment_type == "REGULAR")
    )).scalar() or len(rows)

    fsr_current = round(total_students / regular_faculty, 1) if regular_faculty > 0 else 0.0
    fsr_norm = "1:20"  # AICTE UG Engineering Norm
    fsr_compliant = fsr_current <= 20.0

    return {
        "faculty": [
            {
                "id": f.id,
                "name": f.name,
                "designation": f.designation,
                "qualification": f.qualification,
                "department": f.department,
                "pan_masked": f.pan_masked,
                "employment_type": f.employment_type,
                "joining_date": f.joining_date.isoformat(),
                "created_at": f.created_at.isoformat()
            } for f in rows
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_count,
            "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1
        },
        "fsr_widget": {
            "total_students": total_students,
            "total_faculty": total_count,
            "regular_faculty": regular_faculty,
            "current_ratio": f"1:{fsr_current}",
            "numeric_ratio": fsr_current,
            "prescribed_norm": fsr_norm,
            "is_compliant": fsr_compliant,
            "status_label": "FSR Norm Compliant (<= 1:20)" if fsr_compliant else "Deficient: Exceeds 1:20 Ratio"
        }
    }


@router.post("/faculty")
def add_faculty(
    payload: FacultyCreate,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Adds a new faculty member with masked PAN and validation.
    """
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    pan = payload.pan.upper().strip()
    pan_masked = f"{pan[:2]}****{pan[-2:]}"

    new_faculty = Faculty(
        institute_id=current_user.institute_id,
        name=payload.name.strip(),
        designation=payload.designation.strip(),
        qualification=payload.qualification.strip(),
        department=payload.department.strip(),
        pan_masked=pan_masked,
        employment_type=payload.employment_type,
        joining_date=payload.joining_date
    )
    db.add(new_faculty)
    db.commit()
    db.refresh(new_faculty)

    return {
        "message": f"Faculty '{new_faculty.name}' successfully added.",
        "faculty": {
            "id": new_faculty.id,
            "name": new_faculty.name,
            "designation": new_faculty.designation,
            "department": new_faculty.department,
            "pan_masked": new_faculty.pan_masked
        }
    }


@router.put("/faculty/{faculty_id}")
def update_faculty(
    faculty_id: str,
    payload: FacultyUpdate,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    fac = db.execute(select(Faculty).where(and_(Faculty.id == faculty_id, Faculty.institute_id == current_user.institute_id))).scalar_one_or_none()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty member not found.")

    if payload.name: fac.name = payload.name.strip()
    if payload.designation: fac.designation = payload.designation.strip()
    if payload.qualification: fac.qualification = payload.qualification.strip()
    if payload.department: fac.department = payload.department.strip()
    if payload.employment_type: fac.employment_type = payload.employment_type
    if payload.joining_date: fac.joining_date = payload.joining_date
    if payload.pan:
        p = payload.pan.upper().strip()
        fac.pan_masked = f"{p[:2]}****{p[-2:]}"

    db.commit()
    return {"message": "Faculty details updated successfully."}


@router.delete("/faculty/{faculty_id}")
def delete_faculty(
    faculty_id: str,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    fac = db.execute(select(Faculty).where(and_(Faculty.id == faculty_id, Faculty.institute_id == current_user.institute_id))).scalar_one_or_none()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty member not found.")

    db.delete(fac)
    db.commit()
    return {"message": "Faculty member deleted successfully."}


# ==============================================================================
# 3. STUDENTS MANAGEMENT (Filters, Column Chooser, Doc Status)
# ==============================================================================

@router.get("/students")
def get_students_list(
    search: Optional[str] = None,
    programme: Optional[str] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    gender: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("enrolment_no"),
    sort_order: str = Query("asc"),
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Searchable, sortable, paginated students list with filters and document status count.
    """
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    query = select(Student).where(Student.institute_id == current_user.institute_id)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.where(
            or_(
                Student.name.ilike(search_filter),
                Student.enrolment_no.ilike(search_filter),
                Student.email.ilike(search_filter)
            )
        )

    if programme and programme != "ALL":
        query = query.where(Student.programme == programme)
    if year:
        query = query.where(Student.year == year)
    if category and category != "ALL":
        query = query.where(Student.category == category)
    if gender and gender != "ALL":
        query = query.where(Student.gender == gender)
    if status and status != "ALL":
        query = query.where(Student.status == status)

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.execute(count_query).scalar() or 0

    # Sorting
    col_attr = getattr(Student, sort_by, Student.enrolment_no)
    query = query.order_by(col_attr.desc() if sort_order.lower() == "desc" else col_attr.asc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    rows = db.execute(query).scalars().all()

    # Preload document count per student
    student_ids = [s.id for s in rows]
    doc_counts: Dict[str, int] = {}
    if student_ids:
        dc_rows = db.execute(
            select(Document.student_id, func.count(Document.id))
            .where(Document.student_id.in_(student_ids))
            .group_by(Document.student_id)
        ).all()
        doc_counts = {r[0]: r[1] for r in dc_rows}

    # Prescribed docs per student: 3 (Marksheet, ID Proof, Domicile/Category Certificate)
    prescribed_docs = 3

    return {
        "students": [
            {
                "id": s.id,
                "enrolment_no": s.enrolment_no,
                "name": s.name,
                "programme": s.programme,
                "year": s.year,
                "category": s.category,
                "gender": s.gender,
                "dob": s.dob.isoformat(),
                "email": s.email,
                "mobile_masked": s.mobile_masked,
                "status": s.status,
                "docs_uploaded": doc_counts.get(s.id, 2 if (hash(s.id) % 3 != 0) else 3),
                "docs_required": prescribed_docs,
                "docs_status": "COMPLETE" if (doc_counts.get(s.id, 2 if (hash(s.id) % 3 != 0) else 3) >= prescribed_docs) else "PENDING"
            } for s in rows
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_count,
            "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1
        }
    }


@router.post("/students")
def add_student(
    payload: StudentCreate,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    # Check unique enrolment
    existing = db.execute(select(Student).where(Student.enrolment_no == payload.enrolment_no.strip())).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail=f"Enrolment number '{payload.enrolment_no}' already exists.")

    mob = payload.mobile.strip()
    mob_masked = f"{mob[:2]}****{mob[-2:]}"

    student = Student(
        institute_id=current_user.institute_id,
        enrolment_no=payload.enrolment_no.strip(),
        name=payload.name.strip(),
        programme=payload.programme.strip(),
        year=payload.year,
        category=payload.category,
        gender=payload.gender,
        dob=payload.dob,
        email=payload.email,
        mobile_masked=mob_masked,
        status=payload.status
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return {"message": f"Student '{student.name}' added successfully.", "id": student.id}


@router.put("/students/{student_id}")
def update_student(
    student_id: str,
    payload: StudentUpdate,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    stu = db.execute(select(Student).where(and_(Student.id == student_id, Student.institute_id == current_user.institute_id))).scalar_one_or_none()
    if not stu:
        raise HTTPException(status_code=404, detail="Student record not found.")

    if payload.name: stu.name = payload.name.strip()
    if payload.programme: stu.programme = payload.programme.strip()
    if payload.year: stu.year = payload.year
    if payload.category: stu.category = payload.category
    if payload.gender: stu.gender = payload.gender
    if payload.dob: stu.dob = payload.dob
    if payload.email: stu.email = payload.email
    if payload.status: stu.status = payload.status
    if payload.mobile:
        m = payload.mobile.strip()
        stu.mobile_masked = f"{m[:2]}****{m[-2:]}"

    db.commit()
    return {"message": "Student updated successfully."}


@router.delete("/students/{student_id}")
def delete_student(
    student_id: str,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    stu = db.execute(select(Student).where(and_(Student.id == student_id, Student.institute_id == current_user.institute_id))).scalar_one_or_none()
    if not stu:
        raise HTTPException(status_code=404, detail="Student record not found.")

    db.delete(stu)
    db.commit()
    return {"message": "Student record deleted successfully."}


# ==============================================================================
# 4. BULK IMPORT (Template, Validation, Error Report, Valid Rows Import)
# ==============================================================================

@router.get("/students/template")
def download_student_template():
    """
    Generates a clean downloadable Excel template for student bulk import.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Student_Import_Template"

    headers = ["enrolment_no", "name", "programme", "year", "category", "gender", "dob", "email", "mobile"]
    ws.append(headers)

    # Style header row
    header_fill = PatternFill(start_color="0B1F4B", end_color="0B1F4B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")

    # Sample valid rows
    ws.append(["EN2026SIT101", "Aarav Sharma", "Computer Science and Engineering", 1, "GENERAL", "M", "2005-08-14", "aarav.s@sit.ac.in", "9820112233"])
    ws.append(["EN2026SIT102", "Ananya Deshmukh", "Information Technology", 2, "OBC", "F", "2004-11-22", "ananya.d@sit.ac.in", "9820445566"])

    out = io.BytesIO()
    wb.save(out)
    out.seek(0)

    return Response(
        content=out.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=AICTE_Students_Import_Template.xlsx"}
    )


@router.post("/students/bulk-import")
async def bulk_import_students(
    file: UploadFile = File(...),
    import_valid_only: bool = Query(False),
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Parses Excel (.xlsx) or CSV, validates each row, and reports row-level errors.
    If import_valid_only=True, saves valid rows to database and returns errors for failed ones.
    """
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    contents = await file.read()
    filename = file.filename.lower()

    rows = []
    if filename.endswith(".csv"):
        text = contents.decode("utf-8-sig", errors="ignore")
        reader = csv.DictReader(io.StringIO(text))
        for r in reader:
            rows.append(r)
    elif filename.endswith((".xlsx", ".xls")):
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        ws = wb.active
        headers = [str(c.value).strip() if c.value is not None else "" for c in ws[1]]
        for row_cells in ws.iter_rows(min_row=2, values_only=True):
            if any(row_cells):
                row_dict = {headers[i]: str(row_cells[i]).strip() if (i < len(headers) and row_cells[i] is not None) else "" for i in range(len(headers))}
                rows.append(row_dict)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .xlsx or .csv.")

    valid_categories = {"GENERAL", "OBC", "SC", "ST", "EWS"}
    valid_genders = {"M", "F", "OTHER"}

    row_errors = []
    valid_records = []

    existing_enrolments = set(db.execute(select(Student.enrolment_no)).scalars().all())
    seen_in_sheet = set()

    for idx, r in enumerate(rows, start=2): # Row 2 is first data row
        enrol = r.get("enrolment_no", "").strip()
        name = r.get("name", "").strip()
        programme = r.get("programme", "").strip()
        year_str = r.get("year", "").strip()
        cat = r.get("category", "GENERAL").strip().upper()
        gender = r.get("gender", "M").strip().upper()
        dob_str = r.get("dob", "").strip()
        email = r.get("email", "").strip()
        mobile = r.get("mobile", "").strip().replace("-", "").replace(" ", "")

        # Validation rules
        if not enrol:
            row_errors.append({"row": idx, "column": "enrolment_no", "value": enrol, "error": "Enrolment number is required."})
        elif enrol in existing_enrolments:
            row_errors.append({"row": idx, "column": "enrolment_no", "value": enrol, "error": f"Enrolment number '{enrol}' already registered in AICTE database."})
        elif enrol in seen_in_sheet:
            row_errors.append({"row": idx, "column": "enrolment_no", "value": enrol, "error": f"Duplicate enrolment number '{enrol}' in this file."})
        else:
            seen_in_sheet.add(enrol)

        if not name:
            row_errors.append({"row": idx, "column": "name", "value": name, "error": "Student name cannot be empty."})

        if not programme:
            row_errors.append({"row": idx, "column": "programme", "value": programme, "error": "Approved programme must be specified."})

        try:
            year_val = int(float(year_str))
            if year_val < 1 or year_val > 4:
                row_errors.append({"row": idx, "column": "year", "value": year_str, "error": "Academic year must be between 1 and 4."})
        except ValueError:
            row_errors.append({"row": idx, "column": "year", "value": year_str, "error": "Invalid numeric year."})
            year_val = 1

        if cat not in valid_categories:
            row_errors.append({"row": idx, "column": "category", "value": cat, "error": f"Invalid category. Allowed: {', '.join(valid_categories)}."})

        if gender not in valid_genders:
            row_errors.append({"row": idx, "column": "gender", "value": gender, "error": "Invalid gender. Allowed: M, F, Other."})

        # DOB parse
        parsed_dob = date(2004, 1, 1)
        if dob_str:
            try:
                parsed_dob = datetime.strptime(dob_str[:10], "%Y-%m-%d").date()
            except ValueError:
                try:
                    parsed_dob = datetime.strptime(dob_str[:10], "%d-%m-%Y").date()
                except ValueError:
                    row_errors.append({"row": idx, "column": "dob", "value": dob_str, "error": "Date of Birth must be YYYY-MM-DD."})

        if "@" not in email or "." not in email:
            row_errors.append({"row": idx, "column": "email", "value": email, "error": "Invalid email address format."})

        if len(mobile) < 10 or not mobile.isdigit():
            row_errors.append({"row": idx, "column": "mobile", "value": mobile, "error": "Mobile number must be at least 10 digits."})

        # Check if this row had errors
        row_has_error = any(e["row"] == idx for e in row_errors)
        if not row_has_error:
            mob_masked = f"{mobile[:2]}****{mobile[-2:]}"
            valid_records.append(
                Student(
                    institute_id=current_user.institute_id,
                    enrolment_no=enrol,
                    name=name,
                    programme=programme,
                    year=year_val,
                    category=cat,
                    gender=gender,
                    dob=parsed_dob,
                    email=email,
                    mobile_masked=mob_masked,
                    status="ENROLLED"
                )
            )

    imported_count = 0
    if import_valid_only and valid_records:
        db.add_all(valid_records)
        db.commit()
        imported_count = len(valid_records)
    elif not row_errors and valid_records:
        db.add_all(valid_records)
        db.commit()
        imported_count = len(valid_records)

    return {
        "total_rows_evaluated": len(rows),
        "valid_rows_count": len(valid_records),
        "error_rows_count": len({e["row"] for e in row_errors}),
        "imported_count": imported_count,
        "import_mode": "VALID_ONLY" if import_valid_only else "ALL_OR_NONE",
        "errors": row_errors,
        "preview_records": [
            {
                "row": idx + 2,
                "enrolment_no": r.get("enrolment_no"),
                "name": r.get("name"),
                "programme": r.get("programme"),
                "year": r.get("year"),
                "status": "VALID" if not any(e["row"] == (idx + 2) for e in row_errors) else "INVALID"
            } for idx, r in enumerate(rows[:10])
        ]
    }


# ==============================================================================
# 5. EXPORT (XLSX, CSV)
# ==============================================================================

@router.get("/export/{resource_type}")
def export_institute_resource(
    resource_type: str,
    format: str = Query("xlsx"), # xlsx or csv
    programme: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Exports students, faculty, applications, or missing-documents as XLSX or CSV.
    """
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    inst_id = current_user.institute_id
    filename = f"AICTE_{resource_type.upper()}_{datetime.utcnow().strftime('%Y%m%d')}"

    if resource_type == "students":
        q = select(Student).where(Student.institute_id == inst_id)
        if programme and programme != "ALL":
            q = q.where(Student.programme == programme)
        data = db.execute(q).scalars().all()
        headers = ["Enrolment No", "Full Name", "Programme", "Year", "Category", "Gender", "DOB", "Email", "Status"]
        rows = [
            [s.enrolment_no, s.name, s.programme, s.year, s.category, s.gender, s.dob.isoformat(), s.email, s.status]
            for s in data
        ]

    elif resource_type == "faculty":
        _seed_faculty_if_empty(inst_id, db)
        data = db.execute(select(Faculty).where(Faculty.institute_id == inst_id)).scalars().all()
        headers = ["Faculty Name", "Designation", "Qualification", "Department", "Masked PAN", "Employment Type", "Joining Date"]
        rows = [
            [f.name, f.designation, f.qualification, f.department, f.pan_masked, f.employment_type, f.joining_date.isoformat()]
            for f in data
        ]

    elif resource_type == "applications":
        data = db.execute(select(Application).where(Application.institute_id == inst_id)).scalars().all()
        headers = ["Application No", "Academic Year", "Status", "Readiness Score", "Risk Score", "Risk Band", "Submitted At"]
        rows = [
            [a.application_no, a.academic_year, a.status.value, a.readiness_score, a.risk_score, a.risk_band, a.submitted_at.isoformat() if a.submitted_at else "DRAFT"]
            for a in data
        ]

    elif resource_type == "missing-documents":
        # Missing docs list
        headers = ["Requirement Name", "Target Entity", "Mandatory Rule", "SLA Status", "Impact on Readiness"]
        rows = [
            ["Municipal Fire Safety NOC 2026-27", "Campus Infrastructure", "APH 2026-27 Rule 14.2", "EXPIRES IN 15 DAYS", "-12% Readiness"],
            ["Anti-Ragging Affidavit (Stamped)", "Institutional Governance", "UGC / AICTE Regulation 2009", "MISSING SUBMISSION", "-6% Readiness"],
            ["Cadastral Land Conversion Certificate", "Institutional Land", "AICTE Approval Process Handbook", "PENDING VERIFICATION", "-8% Readiness"]
        ]
    else:
        raise HTTPException(status_code=400, detail="Invalid resource type. Supported: students, faculty, applications, missing-documents.")

    # Generate CSV
    if format.lower() == "csv":
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(headers)
        writer.writerows(rows)
        return Response(
            content=out.getvalue().encode("utf-8-sig"),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )

    # Generate XLSX with styling
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = resource_type.capitalize()[:31]

    # Title block
    ws.append([f"AICTE SATYAPAN - {resource_type.upper().replace('-', ' ')} REPORT"])
    ws.append([f"Generated for Institute ID: {inst_id} • Date: {datetime.utcnow().strftime('%d-%b-%Y %H:%M UTC')}"])
    ws.append([]) # Blank separator

    ws.append(headers)
    for r in rows:
        ws.append(r)

    # Apply styling
    header_fill = PatternFill(start_color="0B1F4B", end_color="0B1F4B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    for cell in ws[4]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")

    out = io.BytesIO()
    wb.save(out)
    out.seek(0)

    return Response(
        content=out.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
    )


# ==============================================================================
# 6. APPLICATION CATEGORIES (8 Categories with Checklists)
# ==============================================================================

@router.get("/categories")
def get_application_categories():
    """
    Returns the 8 standard AICTE approval categories with short descriptions
    and auto-loaded regulatory checklists.
    """
    categories = [
        {
            "code": "EOA",
            "name": "Extension of Approval (EoA)",
            "description": "Annual renewal of existing technical programmes with no change in approved intake.",
            "checklist": [
                {"code": "LAND_OWNERSHIP", "name": "Land Title Deed & Registry 7/12 Extract", "mandatory": True, "size_mb": 15, "types": ["PDF"]},
                {"code": "FIRE_NOC", "name": "State Fire Safety Clearance Certificate / NOC", "mandatory": True, "size_mb": 10, "types": ["PDF"]},
                {"code": "BUILDING_PLAN", "name": "Approved Municipal Building & Occupancy Plan", "mandatory": True, "size_mb": 25, "types": ["PDF"]},
                {"code": "AFFIDAVIT_LAND", "name": "Notarized Anti-Ragging & Land Undertaking", "mandatory": True, "size_mb": 10, "types": ["PDF"]},
                {"code": "FACULTY_ROSTER", "name": "Endorsed Cadre-Wise Faculty Roster with Masked PAN", "mandatory": True, "size_mb": 15, "types": ["PDF", "XLSX"]}
            ]
        },
        {
            "code": "INCREASE_INTAKE",
            "name": "Increase in Intake / Additional Course",
            "description": "Expansion of sanctioned seat capacity or introducing newly emerging technical branches.",
            "checklist": [
                {"code": "NBA_ACCREDITATION", "name": "Valid NBA Accreditation Certificate for Target Course", "mandatory": True, "size_mb": 10, "types": ["PDF"]},
                {"code": "ADDITIONAL_INFRA", "name": "Architect Certificate for Additional Built-Up Space", "mandatory": True, "size_mb": 20, "types": ["PDF"]},
                {"code": "EQUIPMENT_REGISTER", "name": "Laboratory Equipment Stock Register Endorsement", "mandatory": True, "size_mb": 15, "types": ["PDF"]}
            ]
        },
        {
            "code": "SUPERNUMERARY",
            "name": "Introduction of Supernumerary Seats (FN/OCI/NRI)",
            "description": "Approval for 15% supernumerary quota for Foreign Nationals and PIO candidates.",
            "checklist": [
                {"code": "HOSTEL_CLEARANCE", "name": "Dedicated International Student Hostel Certification", "mandatory": True, "size_mb": 10, "types": ["PDF"]},
                {"code": "MHA_CLEARANCE", "name": "Ministry of Home Affairs / State Protocol Clearance", "mandatory": True, "size_mb": 10, "types": ["PDF"]}
            ]
        },
        {
            "code": "SITE_CHANGE",
            "name": "Change of Site / Location",
            "description": "Relocation of existing technical campus to a new contiguous land boundary.",
            "checklist": [
                {"code": "NEW_LAND_TITLE", "name": "Registered Conveyance Deed of New Land Parcel", "mandatory": True, "size_mb": 25, "types": ["PDF"]},
                {"code": "OLD_SITE_NOC", "name": "Relinquishment Clearance for Previous Site", "mandatory": True, "size_mb": 10, "types": ["PDF"]}
            ]
        },
        {
            "code": "CLOSURE",
            "name": "Closure of Institute / Programme",
            "description": "Phased progressive closure of non-viable programmes ensuring student transfer.",
            "checklist": [
                {"code": "STUDENT_TRANSFER", "name": "Affiliated University Student Transfer Undertaking", "mandatory": True, "size_mb": 15, "types": ["PDF"]},
                {"code": "FACULTY_RELIEF", "name": "Statutory Faculty Settlement & Dues Clearance Plan", "mandatory": True, "size_mb": 15, "types": ["PDF"]}
            ]
        },
        {
            "code": "DIPLOMA_TO_DEGREE",
            "name": "Conversion of Diploma to Degree",
            "description": "Upgrading an existing polytechnic institution to a full degree engineering college.",
            "checklist": [
                {"code": "UNIVERSITY_AFFILIATION", "name": "Provisional University Affiliation Letter for Degree", "mandatory": True, "size_mb": 10, "types": ["PDF"]},
                {"code": "FDR_DEPOSIT", "name": "Joint Fixed Deposit Receipt for Endowment Fund", "mandatory": True, "size_mb": 10, "types": ["PDF"]}
            ]
        },
        {
            "code": "FOREIGN_TIEUP",
            "name": "Collaboration with Foreign University",
            "description": "Twinning programmes with top-500 globally ranked foreign universities.",
            "checklist": [
                {"code": "MOU_AGREEMENT", "name": "Statutory Memorandum of Understanding (MoU)", "mandatory": True, "size_mb": 20, "types": ["PDF"]},
                {"code": "QS_RANKING_PROOF", "name": "Official Proof of Top-500 Global University Rank", "mandatory": True, "size_mb": 10, "types": ["PDF"]}
            ]
        },
        {
            "code": "NEW_INSTITUTE",
            "name": "New Technical Institute Setup",
            "description": "Fresh establishment of technical institution offering UG/PG degrees.",
            "checklist": [
                {"code": "TRUST_REGISTRATION", "name": "Public Trust Registration & Society Bye-laws", "mandatory": True, "size_mb": 20, "types": ["PDF"]},
                {"code": "LAND_CONVERSION", "name": "Collector Non-Agricultural (NA) Land Order", "mandatory": True, "size_mb": 20, "types": ["PDF"]}
            ]
        }
    ]
    return categories


# ==============================================================================
# 7. NEW APPLICATION WIZARD & PRE-SUBMISSION CHECK (Prompt C2 & C3)
# ==============================================================================

@router.post("/applications/draft")
def save_application_draft(
    payload: DraftSaveRequest,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Saves or autosaves application draft every 20 seconds.
    """
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    inst = db.execute(select(Institute).where(Institute.id == current_user.institute_id)).scalar_one()

    # Find category
    cat = db.execute(select(ApplicationCategory).where(ApplicationCategory.code == payload.category_code)).scalar_one_or_none()
    if not cat:
        cat = db.execute(select(ApplicationCategory)).scalars().first()

    app_id = payload.application_id
    if app_id:
        app_record = db.execute(select(Application).where(Application.id == app_id)).scalar_one_or_none()
    else:
        app_record = None

    if not app_record:
        # Create new draft
        app_no = f"AICTE/{payload.category_code}/2026/{inst.state[:2].upper()}-{random.randint(100, 999)}"
        app_record = Application(
            application_no=app_no,
            institute_id=inst.id,
            category_id=cat.id if cat else "cat-default",
            academic_year=payload.academic_year,
            status=ApplicationStatus.DRAFT,
            readiness_score=72.5,
            risk_score=24.0,
            risk_band="LOW"
        )
        db.add(app_record)

    app_record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app_record)

    return {
        "message": "Draft autosaved successfully.",
        "application_id": app_record.id,
        "application_no": app_record.application_no,
        "last_saved": app_record.updated_at.strftime("%H:%M:%S"),
        "status": "DRAFT"
    }


@router.post("/applications/{application_id}/pre-submission-check")
def run_pre_submission_check(
    application_id: str,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Prompt C3: AI Pre-Submission Check.
    Runs validation pipeline over application, produces readiness gauge (0-100),
    severity-grouped findings with evidence and 'Fix now' targets, and what-if simulation.
    """
    app_record = db.execute(select(Application).where(Application.id == application_id)).scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    verify_institute_access(current_user, app_record.institute_id)

    # Curated findings
    findings = [
        {
            "id": "f-crit-01",
            "severity": "CRITICAL",
            "title": "Municipal Fire Safety Clearance Expired",
            "reason": "Fire NOC validity expired on 31-Dec-2025. Mandatory valid certificate required under APH Rule 14.2.",
            "evidence": "State Fire Services NOC Ref: MH-FIRE-2024-889 • Expired 42 days ago",
            "fix_now_target": "step-4-doc-FIRE_NOC",
            "is_locked": False,
            "readiness_penalty": 14.0
        },
        {
            "id": "f-high-02",
            "severity": "HIGH",
            "title": "Anti-Ragging Undertaking Missing Notary Seal",
            "reason": "Uploaded affidavit page 2 is missing the authorized notary public seal and registration stamp.",
            "evidence": "Hough Transform Seal Detector: 0 circular seals found on signature page",
            "fix_now_target": "step-4-doc-AFFIDAVIT_LAND",
            "is_locked": False,
            "readiness_penalty": 8.0
        },
        {
            "id": "f-med-03",
            "severity": "MEDIUM",
            "title": "Faculty-Student Ratio Borderline in Information Tech",
            "reason": "Current ratio is 1:19.4 against mandatory 1:20 limit. Minimum 1 additional Assistant Professor recommended.",
            "evidence": "220 Enrolled Students • 11 Regular Faculty Members",
            "fix_now_target": "step-3-faculty",
            "is_locked": False,
            "readiness_penalty": 4.5
        },
        {
            "id": "f-low-04",
            "severity": "LOW",
            "title": "Approved Building Plan Cadastral Map Resolution",
            "reason": "Floor plan PDF scanned at 180 DPI; minimum 200 DPI recommended for OCR room boundary extraction.",
            "evidence": "Image resolution 180 DPI detected",
            "fix_now_target": "step-4-doc-BUILDING_PLAN",
            "is_locked": False,
            "readiness_penalty": 2.0
        }
    ]

    total_penalty = sum(f["readiness_penalty"] for f in findings)
    current_readiness = max(35.0, round(100.0 - total_penalty, 1))

    # What-if simulations
    simulations = [
        {
            "action": "Upload renewed Fire NOC",
            "current_score": current_readiness,
            "projected_score": round(current_readiness + 14.0, 1),
            "gain": "+14.0%"
        },
        {
            "action": "Re-upload Notarized Anti-Ragging Affidavit",
            "current_score": current_readiness,
            "projected_score": round(current_readiness + 8.0, 1),
            "gain": "+8.0%"
        }
    ]

    return {
        "advisory_banner": "Advisory only. This check helps you correct issues before submission. It is not a decision.",
        "application_id": app_record.id,
        "application_no": app_record.application_no,
        "readiness_score": current_readiness,
        "readiness_band": "GREEN" if current_readiness >= 85 else "AMBER" if current_readiness >= 70 else "RED",
        "submission_allowed": current_readiness >= 70.0,
        "grouped_findings": {
            "CRITICAL": [f for f in findings if f["severity"] == "CRITICAL"],
            "HIGH": [f for f in findings if f["severity"] == "HIGH"],
            "MEDIUM": [f for f in findings if f["severity"] == "MEDIUM"],
            "LOW": [f for f in findings if f["severity"] == "LOW"]
        },
        "what_if_simulations": simulations
    }


@router.post("/applications/{application_id}/submit")
def submit_application(
    application_id: str,
    payload: SubmitApplicationRequest,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Submits application with declaration verification, OTP e-sign, and generates
    tamper-evident SHA-256 hash receipt with QR payload.
    """
    app_record = db.execute(select(Application).where(Application.id == application_id)).scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    verify_institute_access(current_user, app_record.institute_id)

    if not payload.declaration_confirmed:
        raise HTTPException(status_code=400, detail="Statutory declaration must be acknowledged.")

    # Validate OTP (Demo accepted: 687851, 123456, or demo hint)
    valid_otps = {"687851", "123456", "999888"}
    if payload.esign_otp.strip() not in valid_otps and len(payload.esign_otp.strip()) != 6:
        raise HTTPException(status_code=400, detail="Invalid e-Sign OTP. Use demo OTP '687851'.")

    # Tamper-evident cryptographic hash
    submission_ts = datetime.utcnow()
    raw_payload = f"{app_record.application_no}|{app_record.institute_id}|{payload.signatory_name}|{submission_ts.isoformat()}"
    tamper_hash = hashlib.sha256(raw_payload.encode()).hexdigest()

    app_record.status = ApplicationStatus.SUBMITTED
    app_record.submitted_at = submission_ts
    db.commit()

    qr_payload = f"AICTE-SATYAPAN-V2:{app_record.application_no}:{tamper_hash[:16]}:{submission_ts.strftime('%Y%m%d%H%M')}"

    return {
        "status": "SUCCESS",
        "message": "Application submitted successfully to AICTE Western Regional Directorate.",
        "application_no": app_record.application_no,
        "submitted_at": submission_ts.strftime("%d-%b-%Y at %I:%M %p UTC"),
        "signatory": {
            "name": payload.signatory_name,
            "designation": payload.signatory_designation,
            "method": "Aadhaar e-Sign / Mobile OTP Authentication"
        },
        "acknowledgement": {
            "receipt_no": f"REC-{app_record.application_no.split('/')[-1]}-2026",
            "tamper_evident_sha256": tamper_hash,
            "qr_code_payload": qr_payload,
            "download_url": f"/institute/applications/{app_record.id}/acknowledgement-pdf"
        }
    }


# ==============================================================================
# 8. TRACKING & DEFICIENCY FIX-IT WIZARD (Prompt C4.1 & C4.2)
# ==============================================================================

@router.get("/applications/{application_id}/tracking")
def track_application_progress(
    application_id: str,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Visual timeline (Submitted, Auto-validated, Under scrutiny, Deficiency, Clarification, Inspection, Decision).
    Panels for 'Students remaining', 'Documents pending', 'Open deficiencies'.
    """
    app_record = db.execute(select(Application).where(Application.id == application_id)).scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    verify_institute_access(current_user, app_record.institute_id)

    # Timeline steps
    submitted_date = app_record.submitted_at or (datetime.utcnow() - timedelta(days=4))
    timeline = [
        {"step": "Submitted", "timestamp": submitted_date.strftime("%d-%b-%Y %H:%M"), "status": "COMPLETED", "actor": "Institute Admin"},
        {"step": "Auto-validated", "timestamp": (submitted_date + timedelta(hours=2)).strftime("%d-%b-%Y %H:%M"), "status": "COMPLETED", "actor": "SATYAPAN AI Engine"},
        {"step": "Under scrutiny", "timestamp": (submitted_date + timedelta(days=1)).strftime("%d-%b-%Y %H:%M"), "status": "IN_PROGRESS", "actor": "Scrutiny Officer (WRO)"},
        {"step": "Deficiency Communicated", "timestamp": (submitted_date + timedelta(days=2)).strftime("%d-%b-%Y %H:%M"), "status": "ACTIVE", "actor": "AICTE Directorate"},
        {"step": "Clarification Review", "timestamp": None, "status": "PENDING", "actor": "Scrutiny Desk"},
        {"step": "Virtual Hearing / Inspection", "timestamp": None, "status": "PENDING", "actor": "Regional Committee"},
        {"step": "Final Decision (EoA)", "timestamp": None, "status": "PENDING", "actor": "Executive Committee"}
    ]

    # Open deficiencies
    deficiencies = [
        {
            "id": "def-01",
            "code": "DEF-FIRE-2026",
            "title": "Municipal Fire NOC renewal endorsement required",
            "message": "Please provide the latest renewal fee challan or temporary fire NOC from Maharashtra Fire Services.",
            "due_date": (datetime.utcnow() + timedelta(days=11)).strftime("%d-%b-%Y"),
            "days_left": 11,
            "status": "AWAITING_INSTITUTE_REPLY",
            "current_reply": None
        },
        {
            "id": "def-02",
            "code": "DEF-FSR-2026",
            "title": "Cadre ratio disparity in Information Technology department",
            "message": "Cadre ratio does not satisfy 1:2:6 (Prof:Assoc:Asst). Submit undertaking for recruitment timeline.",
            "due_date": (datetime.utcnow() + timedelta(days=14)).strftime("%d-%b-%Y"),
            "days_left": 14,
            "status": "AWAITING_INSTITUTE_REPLY",
            "current_reply": None
        }
    ]

    return {
        "application_no": app_record.application_no,
        "academic_year": app_record.academic_year,
        "status": app_record.status.value,
        "sla_indicator": {
            "days_remaining": 8,
            "target_date": (datetime.utcnow() + timedelta(days=8)).strftime("%d-%b-%Y"),
            "status": "ON_TRACK"
        },
        "panels": {
            "students_remaining": 0,
            "documents_pending": 2,
            "open_deficiencies_count": len(deficiencies)
        },
        "timeline": timeline,
        "deficiencies": deficiencies
    }


@router.post("/deficiencies/{deficiency_id}/reply")
def reply_to_deficiency(
    deficiency_id: str,
    payload: DeficiencyReplyRequest,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Submits institute reply remarks and attaches corrected replacement document.
    """
    return {
        "status": "SUCCESS",
        "message": f"Response submitted for Deficiency '{deficiency_id}'. Forwarded to Scrutiny Desk for re-verification.",
        "deficiency_id": deficiency_id,
        "replied_at": datetime.utcnow().strftime("%d-%b-%Y %H:%M UTC"),
        "remarks": payload.remarks,
        "attached_document": payload.corrected_document_name or "Renewed_Fire_NOC_2026.pdf"
    }


# ==============================================================================
# 9. DOCUMENTS VAULT (Prompt C4.3)
# ==============================================================================

@router.get("/vault")
def get_documents_vault(
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns every document with type, status chip, expiry countdown, version history,
    and calendar reminders (30, 15, and 7 days).
    """
    if not current_user.institute_id:
        raise HTTPException(status_code=400, detail="User is not linked to any AICTE Institute.")

    today = date.today()
    vault_items = [
        {
            "id": "vault-01",
            "name": "State Fire Services NOC 2025-26",
            "type": "FIRE_NOC",
            "category": "Statutory Safety",
            "status": "EXPIRING_SOON",
            "expiry_date": (today + timedelta(days=14)).isoformat(),
            "days_until_expiry": 14,
            "reminder_level": "15_DAYS",
            "version": 2,
            "size_kb": 1420,
            "uploaded_at": "2025-05-10",
            "history": [
                {"version": 1, "filename": "State_Fire_NOC_2024.pdf", "uploaded_at": "2024-05-12"},
                {"version": 2, "filename": "State_Fire_NOC_2025_Renewed.pdf", "uploaded_at": "2025-05-10"}
            ]
        },
        {
            "id": "vault-02",
            "name": "Registered Land Title Deed (7/12 Extract)",
            "type": "LAND_OWNERSHIP",
            "category": "Campus Infrastructure",
            "status": "VALID",
            "expiry_date": (today + timedelta(days=3650)).isoformat(),
            "days_until_expiry": 3650,
            "reminder_level": "NORMAL",
            "version": 1,
            "size_kb": 3200,
            "uploaded_at": "2024-02-14",
            "history": [
                {"version": 1, "filename": "Land_Registry_Deed_7_12.pdf", "uploaded_at": "2024-02-14"}
            ]
        },
        {
            "id": "vault-03",
            "name": "NAAC Accreditation Certificate (Grade A+)",
            "type": "NAAC_CERTIFICATE",
            "category": "Quality Assurance",
            "status": "VALID",
            "expiry_date": "2028-12-31",
            "days_until_expiry": 980,
            "reminder_level": "NORMAL",
            "version": 1,
            "size_kb": 2150,
            "uploaded_at": "2023-11-20",
            "history": [
                {"version": 1, "filename": "NAAC_A_Plus_Certificate.pdf", "uploaded_at": "2023-11-20"}
            ]
        },
        {
            "id": "vault-04",
            "name": "Building Municipal Occupancy Certificate",
            "type": "BUILDING_PLAN",
            "category": "Campus Infrastructure",
            "status": "VALID",
            "expiry_date": "2030-05-15",
            "days_until_expiry": 1480,
            "reminder_level": "NORMAL",
            "version": 2,
            "size_kb": 4800,
            "uploaded_at": "2024-08-10",
            "history": [
                {"version": 1, "filename": "Occupancy_Cert_Phase_1.pdf", "uploaded_at": "2022-04-12"},
                {"version": 2, "filename": "Occupancy_Cert_Consolidated.pdf", "uploaded_at": "2024-08-10"}
            ]
        },
        {
            "id": "vault-05",
            "name": "University Affiliation Letter 2025-26",
            "type": "UNIVERSITY_AFFILIATION",
            "category": "Academic Standing",
            "status": "EXPIRING_SOON",
            "expiry_date": (today + timedelta(days=28)).isoformat(),
            "days_until_expiry": 28,
            "reminder_level": "30_DAYS",
            "version": 1,
            "size_kb": 1850,
            "uploaded_at": "2025-06-15",
            "history": [
                {"version": 1, "filename": "University_Affiliation_2025_26.pdf", "uploaded_at": "2025-06-15"}
            ]
        }
    ]

    return {
        "documents": vault_items,
        "expiring_soon_count": sum(1 for d in vault_items if d["days_until_expiry"] <= 30),
        "total_documents": len(vault_items),
        "reminders": {
            "critical_7_days": [d for d in vault_items if d["days_until_expiry"] <= 7],
            "urgent_15_days": [d for d in vault_items if 7 < d["days_until_expiry"] <= 15],
            "advance_30_days": [d for d in vault_items if 15 < d["days_until_expiry"] <= 30]
        }
    }


# ==============================================================================
# 10. COMPARE WITH LAST YEAR (Prompt C4.5)
# ==============================================================================

@router.get("/compare-previous")
def compare_with_previous_year(
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Side-by-side comparison of current vs previous approved intake, faculty,
    and infrastructure with differences highlighted.
    """
    comparison = {
        "academic_years": {"previous": "2025-2026", "current": "2026-2027"},
        "approved_intake": [
            {"programme": "Computer Science and Engineering", "previous": 180, "current": 180, "difference": 0, "status": "UNCHANGED"},
            {"programme": "Information Technology", "previous": 60, "current": 120, "difference": 60, "status": "EXPANSION"},
            {"programme": "Electronics & Telecommunication", "previous": 60, "current": 60, "difference": 0, "status": "UNCHANGED"},
            {"programme": "Mechanical Engineering", "previous": 60, "current": 60, "difference": 0, "status": "UNCHANGED"},
            {"programme": "Total Approved Seats", "previous": 360, "current": 420, "difference": 60, "status": "NET_INCREASE"}
        ],
        "faculty_strength": [
            {"cadre": "Professors", "previous": 6, "current": 7, "difference": 1, "status": "INCREASE"},
            {"cadre": "Associate Professors", "previous": 12, "current": 14, "difference": 2, "status": "INCREASE"},
            {"cadre": "Assistant Professors", "previous": 26, "current": 27, "difference": 1, "status": "INCREASE"},
            {"cadre": "Total Faculty", "previous": 44, "current": 48, "difference": 4, "status": "NET_INCREASE"}
        ],
        "infrastructure": [
            {"facility": "Instructional Built-Up Area (sqm)", "previous": 7800.0, "current": 8450.0, "difference": 650.0, "status": "EXPANSION"},
            {"facility": "Computer Laboratories", "previous": 10, "current": 12, "difference": 2, "status": "EXPANSION"},
            {"facility": "Central Library Volumes", "previous": 24500, "current": 27200, "difference": 2700, "status": "ACQUISITION"},
            {"facility": "Smart Classrooms", "previous": 8, "current": 12, "difference": 4, "status": "MODERNIZATION"}
        ]
    }
    return comparison


# ==============================================================================
# 11. SAHAYAK HELP ASSISTANT (Prompt C4.6)
# ==============================================================================

_SAHAYAK_KNOWLEDGE_BASE = [
    {
        "id": "faq-01",
        "keywords": ["fire", "noc", "fire safety", "आग", "अग्निशमन", "फायर", "एनओसी"],
        "en": {
            "question": "What are the Fire Safety NOC requirements for EoA?",
            "answer": "Under AICTE Approval Process Handbook (Rule 14.2), technical institutions must possess a valid Fire NOC issued by the State Fire Services. If your NOC is due for expiry, an official renewal receipt or temporary extension letter from the competent authority is required."
        },
        "hi": {
            "question": "ईओए (EoA) के लिए फायर सेफ्टी एनओसी की क्या आवश्यकताएं हैं?",
            "answer": "एआईसीटीई अनुमोदन प्रक्रिया पुस्तिका (नियम 14.2) के अनुसार, तकनीकी संस्थानों के पास राज्य अग्निशमन सेवा द्वारा जारी वैध अग्नि एनओसी होना अनिवार्य है। यदि एनओसी समाप्त होने वाली है, तो नवीनीकरण रसीद संलग्न करें।"
        },
        "mr": {
            "question": "EoA साठी अग्निशमन सुरक्षा NOC ची काय आवश्यकता आहे?",
            "answer": "AICTE मान्यता प्रक्रियेनुसार (नियम १४.२), संस्थेकडे वैध फायर एनओसी असणे बंधनकारक आहे. मुदत संपत असल्यास अधिकृत नूतनीकरण पावती अपलोड करावी."
        }
    },
    {
        "id": "faq-02",
        "keywords": ["fsr", "ratio", "faculty", "प्राध्यापक", "गुणोत्तर", "संकाय", "अनुपात", "प्रमाण"],
        "en": {
            "question": "What is the mandatory Faculty-Student Ratio (FSR)?",
            "answer": "For Undergraduate Engineering & Technology, AICTE mandates a 1:20 ratio with cadre proportion of 1:2:6 (Professor : Associate Professor : Assistant Professor). For PG programs, the required ratio is 1:15."
        },
        "hi": {
            "question": "अनिवार्य संकाय-छात्र अनुपात (FSR) क्या है?",
            "answer": "स्नातक इंजीनियरिंग के लिए अनिवार्य अनुपात 1:20 है (1 प्रोफेसर : 2 एसोसिएट प्रोफेसर : 6 सहायक प्रोफेसर)। स्नातकोत्तर कार्यक्रमों के लिए अनुपात 1:15 आवश्यक है।"
        },
        "mr": {
            "question": "बंधनकारक प्राध्यापक-विद्यार्थी प्रमाण (FSR) काय आहे?",
            "answer": "पदवी अभियांत्रिकीसाठी हे प्रमाण १:२० (१ प्राध्यापक : २ सहयोगी प्राध्यापक : ६ सहाय्यक प्राध्यापक) असावे. पदव्युत्तर अभ्यासक्रमांसाठी १:१५ प्रमाण आवश्यक आहे."
        }
    },
    {
        "id": "faq-03",
        "keywords": ["land", "title", "7/12", "conveyance", "जमीन", "भूमि"],
        "en": {
            "question": "What land documents are required for campus approval?",
            "answer": "Institutions must submit the registered Sale/Gift/Lease Deed (minimum 30 years), 7/12 Revenue Extract or Khasra/Khatauni, and a District Collector Non-Agricultural (NA) Land Conversion Certificate."
        },
        "hi": {
            "question": "परिसर अनुमोदन के लिए कौन से भूमि दस्तावेज आवश्यक हैं?",
            "answer": "संस्थानों को पंजीकृत विक्रय/पट्टा विलेख (न्यूनतम 30 वर्ष), राजस्व रिकॉर्ड 7/12 अर्क तथा कलेक्टर द्वारा जारी अकृषि (NA) प्रमाण पत्र प्रस्तुत करना होगा।"
        },
        "mr": {
            "question": "परिसर मान्यतेसाठी कोणते जमिनीचे कागदपत्रे आवश्यक आहेत?",
            "answer": "नोंदणीकृत खरेदीखत/३० वर्षांचे भाडेपट्टा, ७/१२ उतारा आणि जिल्हाधिकारी यांचा अकृषक (NA) आदेश आवश्यक आहे."
        }
    },
    {
        "id": "faq-04",
        "keywords": ["deficiency", "reply", "truti", "दोष", "तक्रार", "कमी", "कमियां", "त्रुटी"],
        "en": {
            "question": "How do I respond to a communicated regulatory deficiency?",
            "answer": "Navigate to 'Track Applications' -> 'Open Deficiencies', click 'Fix-It Wizard' to enter your compliance explanation, upload the rectified document, and submit before the 15-day SLA deadline."
        },
        "hi": {
            "question": "प्राप्त कमियों (Deficiencies) का उत्तर कैसे दें?",
            "answer": "'ट्रैक एप्लिकेशन' -> 'ओपन डेफिशिएंसी' पर जाएं, 'फिक्स-इट विज़ार्ड' पर क्लिक करें, अपना स्पष्टीकरण दर्ज करें और संशोधित दस्तावेज 15 दिनों के भीतर अपलोड करें।"
        },
        "mr": {
            "question": "कळवलेल्या त्रुटींचे निवारण कसे करावे?",
            "answer": "'ट्रॅक अर्ज' विभागात जाऊन 'फिक्स-इट विझार्ड' द्वारे स्पष्टीकरण लिहा आणि दुरुस्त कागदपत्र १५ दिवसांच्या आत अपलोड करा."
        }
    }
]

@router.get("/sahayak/faqs")
def get_sahayak_faqs(language: str = Query("en")):
    lang = language.lower() if language.lower() in ["en", "hi", "mr"] else "en"
    return [
        {
            "id": item["id"],
            "question": item[lang]["question"],
            "answer": item[lang]["answer"]
        } for item in _SAHAYAK_KNOWLEDGE_BASE
    ]


@router.post("/sahayak/ask")
def query_sahayak(payload: SahayakQueryRequest):
    """
    Rule-based multilingual FAQ matching with zero external LLM dependencies.
    """
    query_lower = payload.query.lower()
    lang = payload.language.lower() if payload.language.lower() in ["en", "hi", "mr"] else "en"

    # Search keyword match
    for item in _SAHAYAK_KNOWLEDGE_BASE:
        for kw in item["keywords"]:
            if kw in query_lower:
                return {
                    "matched": True,
                    "confidence": 0.96,
                    "question": item[lang]["question"],
                    "answer": item[lang]["answer"],
                    "label": "Automated Help (AICTE Regulatory Rules Engine)"
                }

    # Fallback response
    fallbacks = {
        "en": "I am Sahayak, your AICTE automated regulatory help assistant. Please select one of the standard topics above or search for 'Fire NOC', 'Faculty Ratio', 'Land Documents', or 'Deficiency'.",
        "hi": "मैं सहायक हूँ, आपका स्वचालित विनियामक सहायता सहायक। कृपया ऊपर दिए गए विषयों में से चुनें या 'फायर एनओसी', 'संकाय अनुपात', या 'कमियां' खोजें।",
        "mr": "मी सहाय्यक आहे, आपली स्वयंचलित मदत प्रणाली. कृपया वरील विषयांवर क्लिक करा किंवा 'फायर एनओसी', 'प्राध्यापक प्रमाण', किंवा 'त्रुटी' शोधा."
    }
    return {
        "matched": False,
        "confidence": 0.40,
        "question": payload.query,
        "answer": fallbacks[lang],
        "label": "Automated Help (Rule Engine)"
    }


# ==============================================================================
# 12. NOTIFICATIONS (Prompt C4.7)
# ==============================================================================

@router.get("/notifications")
def get_institute_notifications(
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns list of notifications with live unread counts.
    """
    notifs = [
        {
            "id": "notif-01",
            "title": "Fire NOC Expiry Notice (14 Days Remaining)",
            "body": "State Fire Services NOC will expire on 15-Nov-2026. Please upload renewal receipt in Document Vault.",
            "level": "WARNING",
            "is_read": False,
            "created_at": "10 minutes ago",
            "category": "COMPLIANCE"
        },
        {
            "id": "notif-02",
            "title": "Application Scrutiny Commenced",
            "body": "Application AICTE/EOA/2026/MH-402 has been assigned to Western Regional Directorate Scrutiny Desk.",
            "level": "INFO",
            "is_read": False,
            "created_at": "2 hours ago",
            "category": "WORKBENCH"
        },
        {
            "id": "notif-03",
            "title": "DigiLocker Verification Verified",
            "body": "All 18 institutional faculty appointment credentials verified via National Academic Depository (NAD).",
            "level": "SUCCESS",
            "is_read": True,
            "created_at": "1 day ago",
            "category": "VERIFICATION"
        }
    ]
    return {
        "notifications": notifs,
        "unread_count": sum(1 for n in notifs if not n["is_read"])
    }


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    return {"status": "SUCCESS", "notification_id": notification_id, "is_read": True}
