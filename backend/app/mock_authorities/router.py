"""
Mock Issuing Authorities Router
Runs directly inside the FastAPI backend.
Principle 6: SYNTHETIC DATA ONLY. Every response carries a visible 'SIMULATED SOURCE' badge
and header so nobody mistakes it for a real integration.
"""
from fastapi import APIRouter, Response
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/mock-authorities", tags=["Mock Issuing Authorities"])


def add_simulated_headers(response: Response):
    response.headers["X-Data-Source"] = "SIMULATED_AUTHORITY"
    response.headers["X-Notice"] = "AICTE SATYAPAN Mock Issuing Authority - Synthetic Data for Hackathon Evaluation Only"


# 1. Mock DigiLocker
@router.get("/digilocker/documents/{doc_type}/{doc_id}")
async def mock_digilocker(doc_type: str, doc_id: str, response: Response):
    add_simulated_headers(response)
    
    # Synthetic records for demo institutes
    mock_database = {
        "FIRE_NOC_MH_2024_001": {
            "authority": "Maharashtra Fire & Emergency Services",
            "certificate_number": "FIRE_NOC_MH_2024_001",
            "issued_to": "Saraswati Institute of Technology, Pune",
            "issue_date": "2024-03-15",
            "expiry_date": "2027-03-14",
            "status": "VALID",
            "is_tampered": False
        },
        "FIRE_NOC_MH_EXPIRED": {
            "authority": "Maharashtra Fire & Emergency Services",
            "certificate_number": "FIRE_NOC_MH_EXPIRED",
            "issued_to": "Sahyadri College of Engineering, Nashik",
            "issue_date": "2021-01-10",
            "expiry_date": "2024-01-09",
            "status": "EXPIRED",
            "is_tampered": False
        }
    }
    
    data = mock_database.get(doc_id, {
        "authority": "National DigiLocker Authority (Simulated)",
        "certificate_number": doc_id,
        "issued_to": "Synthetic Technical Institute",
        "issue_date": "2023-05-10",
        "expiry_date": "2026-05-09",
        "status": "VALID",
        "is_tampered": False
    })
    
    return {
        "source": "SIMULATED SOURCE: National DigiLocker API",
        "is_simulated": True,
        "data": data,
        "verified_at": datetime.utcnow().isoformat()
    }


# 2. Mock UGC & University Affiliation Portal
@router.get("/ugc/affiliation/{university_code}/{college_code}")
async def mock_ugc_affiliation(university_code: str, college_code: str, response: Response):
    add_simulated_headers(response)
    return {
        "source": "SIMULATED SOURCE: University Grants Commission (UGC) Portal",
        "is_simulated": True,
        "affiliation_status": "AFFILIATED",
        "university_name": "Savitribai Phule Pune University",
        "college_code": college_code,
        "valid_up_to": "2027-06-30",
        "sanctioned_courses": [
            {"course": "Computer Engineering", "intake": 120},
            {"course": "Electronics & Telecommunication", "intake": 60},
            {"course": "Mechanical Engineering", "intake": 60}
        ],
        "verified_at": datetime.utcnow().isoformat()
    }


# 3. Mock NAAC & NBA Accreditation Registry
@router.get("/accreditation/check/{institute_aicte_id}")
async def mock_naac_nba(institute_aicte_id: str, response: Response):
    add_simulated_headers(response)
    return {
        "source": "SIMULATED SOURCE: National Assessment and Accreditation Council (NAAC)",
        "is_simulated": True,
        "aicte_id": institute_aicte_id,
        "naac_grade": "A+",
        "naac_cgpa": 3.42,
        "cycle": "Cycle 2",
        "validity": "2023-2028",
        "nba_accredited_programs": ["Computer Engineering", "Mechanical Engineering"],
        "verified_at": datetime.utcnow().isoformat()
    }


# 4. Mock State Land Records & Tehsildar Portal (Bhulekh / Mahabhumi)
@router.get("/land-registry/verify/{survey_number}")
async def mock_land_registry(survey_number: str, response: Response):
    add_simulated_headers(response)
    
    mock_land_records = {
        "SRV-PUNE-402": {
            "survey_number": "SRV-PUNE-402",
            "owner": "Saraswati Education Society",
            "area_in_acres": 3.25,
            "land_type": "Institutional / Educational Non-Agriculture (NA)",
            "title": "Clear & Unencumbered",
            "encumbrance_status": "NIL"
        },
        "SRV-NASHIK-108": {
            "survey_number": "SRV-NASHIK-108",
            "owner": "Sahyadri Trust",
            "area_in_acres": 1.40, # Deficit for Engineering college standard (minimum 2.5 acres required)
            "land_type": "Educational NA",
            "title": "Clear",
            "encumbrance_status": "NIL"
        }
    }
    
    record = mock_land_records.get(survey_number, {
        "survey_number": survey_number,
        "owner": "Simulated Educational Trust",
        "area_in_acres": 2.80,
        "land_type": "Educational NA",
        "title": "Clear",
        "encumbrance_status": "NIL"
    })
    
    return {
        "source": "SIMULATED SOURCE: State Revenue & Land Records Registry (Mahabhumi / Bhulekh)",
        "is_simulated": True,
        "land_record": record,
        "verified_at": datetime.utcnow().isoformat()
    }


# 5. Generic Verification Adapter Layer Endpoint (Prompt B3)
class AuthorityVerificationRequest(BaseModel):
    reference_no: str
    institute_id: Optional[str] = None
    fields: Optional[dict] = None


@router.post("/{code}/verify")
async def verify_mock_authority(code: str, req: AuthorityVerificationRequest, response: Response):
    """
    Standardized Verification Adapter Layer:
    Simulates external issuing authority APIs (UGC, NAAC, NBA, UNIVERSITY, FIRE_DEPT, TRUST_REGISTRAR, MUNICIPAL, DIGILOCKER).
    Always includes is_simulated=true and realistic latency simulation.
    """
    add_simulated_headers(response)
    code_upper = code.upper()

    authorities_map = {
        "UGC": "University Grants Commission Official Registry",
        "NAAC": "National Assessment and Accreditation Council Repository",
        "NBA": "National Board of Accreditation Verification Gateway",
        "UNIVERSITY": "State University Affiliation Portal",
        "FIRE_DEPT": "Municipal Fire Prevention Directorate",
        "TRUST_REGISTRAR": "Office of the Charity Commissioner & Registrar of Societies",
        "MUNICIPAL": "Town Planning and Municipal Corporation Directorate",
        "DIGILOCKER": "National DigiLocker Repository (MeitY)"
    }
    source_name = authorities_map.get(code_upper, f"{code_upper} Gateway (Simulated)")

    # Status outcomes
    status_val = "VERIFIED"
    if "EXPIRED" in req.reference_no.upper():
        status_val = "EXPIRED"
    elif "MISMATCH" in req.reference_no.upper():
        status_val = "MISMATCH_DETECTED"
    elif "UNTRUSTED" in req.reference_no.upper():
        status_val = "NOT_FOUND"

    return {
        "status": status_val,
        "source_name": f"SIMULATED SOURCE: {source_name}",
        "is_simulated": True,
        "authority_code": code_upper,
        "reference_no": req.reference_no,
        "signed_response": {
            "token": f"GATEWAY-SIG-{code_upper}-7721",
            "issuer": source_name,
            "status": status_val,
            "latency_ms": 420
        },
        "timestamp": datetime.utcnow().isoformat()
    }
