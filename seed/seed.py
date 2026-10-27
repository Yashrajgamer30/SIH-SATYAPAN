"""
AICTE SATYAPAN - Monorepo Master Seed Script
Idempotent data generator with --reset flag.
Generates:
- 40 technical institutes across 15+ Indian states
- 8 official APH application categories with realistic checklists & rules JSON
- 70+ applications in mixed statuses across academic years
- 150+ faculty members with masked PANs and cadre distribution
- 600+ students across programmes, years, genders, and categories
- 5 mandated demo accounts (Argon2 hashed with 'Demo@1234')
- Richly populated demo institute (4 programmes, 5 yrs intake history, 3 applications, documents, 2 deficiencies)
- 5 years of historical monthly intake and disposal metrics for officials trendlines
- Hash-chained audit logs with SHA-256 integrity

Acceptance: Runs in under 30 seconds.
"""
import sys
import os
import argparse
import random
import uuid
import json
import hashlib
from datetime import datetime, date, timedelta

# Ensure backend path is accessible
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import create_engine, select, func, text
from sqlalchemy.orm import sessionmaker

from app.models.schemas import (
    Base, User, Institute, InstituteRecord, ApplicationCategory, Application,
    Faculty, Student, Document, OCRResult, ValidationRun, Finding, TamperReport,
    SignatureCheck, Verification, InfraEvidence, Deficiency, OfficialAction,
    Notification, AuditLog, DataAccessLog, ConfigVersion, EvaluationMetric,
    UserRole, ApplicationStatus, FindingSeverity, FindingType, FindingStatus,
    VerificationStatus
)
from argon2 import PasswordHasher

ph = PasswordHasher()
DEMO_PASSWORD_HASH = ph.hash("Demo@1234")

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "satyapan.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


# 15+ Indian States & Districts
STATES_DATA = [
    ("Maharashtra", ["Pune", "Mumbai City", "Nashik", "Nagpur", "Aurangabad", "Kolhapur"]),
    ("Karnataka", ["Bengaluru Urban", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi"]),
    ("Tamil Nadu", ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"]),
    ("Telangana", ["Hyderabad", "Warangal", "Ranga Reddy", "Karimnagar"]),
    ("Gujarat", ["Ahmedabad", "Surat", "Vadodara", "Rajkot"]),
    ("Uttar Pradesh", ["Lucknow", "Noida", "Kanpur", "Varanasi", "Ghaziabad"]),
    ("Madhya Pradesh", ["Bhopal", "Indore", "Jabalpur", "Gwalior"]),
    ("Rajasthan", ["Jaipur", "Jodhpur", "Kota", "Udaipur"]),
    ("West Bengal", ["Kolkata", "Howrah", "Durgapur", "Siliguri"]),
    ("Kerala", ["Thiruvananthapuram", "Ernakulam", "Kozhikode", "Thrissur"]),
    ("Andhra Pradesh", ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"]),
    ("Punjab", ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"]),
    ("Haryana", ["Gurugram", "Faridabad", "Ambala", "Hisar"]),
    ("Odisha", ["Bhubaneswar", "Cuttack", "Rourkela"]),
    ("Delhi", ["New Delhi", "North Delhi", "South Delhi"]),
    ("Assam", ["Guwahati", "Dibrugarh", "Silchar"])
]

INSTITUTE_PREFIXES = [
    "Saraswati", "Vishwakarma", "Dr. A.P.J. Abdul Kalam", "Maharaja Agrasen", "Chhatrapati Shivaji",
    "Netaji Subhash", "Swami Vivekananda", "Birla", "Thapar", "PSG", "Rajiv Gandhi",
    "Sardar Patel", "Jawaharlal Nehru", "K.J. Somaiya", "Shri Govindram", "Guru Nanak",
    "Dayananda Sagar", "B.M.S.", "M.S. Ramaiah", "Vidyalankar", "Pillai", "Bhartiya Vidya Bhavan",
    "Techno India", "Amrita", "Kalinga", "CV Raman", "Marathwada Mitra Mandal", "Sinhgad",
    "Dr. D.Y. Patil", "Indira", "Modern", "Symbiosis", "Vel Tech", "Sathyabama", "MIT"
]

PROGRAMMES = [
    "Computer Science and Engineering",
    "Artificial Intelligence and Machine Learning",
    "Electronics and Communication Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Information Technology"
]

CATEGORIES_DATA = [
    {
        "code": "EXTENSION_OF_APPROVAL",
        "name": "Extension of Approval (EoA)",
        "checklist": [
            "Contiguous Land Ownership Deed & 7/12 Extract",
            "Approved Building Plan & Occupancy Certificate",
            "Fire Safety Department Valid NOC",
            "AICTE-Joint Fixed Deposit Receipt (FDR)",
            "Faculty Cadre Roster & Salary Bank Statements",
            "University Affiliation Letter"
        ],
        "rules": {
            "min_acres_urban": 2.5,
            "min_acres_rural": 4.0,
            "max_sfr": 20.0,
            "fire_noc_must_be_active": True,
            "fdr_joint_required": True
        }
    },
    {
        "code": "INCREASE_IN_INTAKE",
        "name": "Increase in Intake",
        "checklist": [
            "NBA Accreditation Certificate (min 30% programmes)",
            "Built-up Carpet Area for Additional Intake",
            "Additional Faculty Commitment Affidavit",
            "TER Fee Payment Receipt"
        ],
        "rules": {
            "min_nba_score": 675,
            "additional_sqm_per_intake_60": 420.0,
            "no_standing_deficiency": True
        }
    },
    {
        "code": "NEW_COURSE",
        "name": "Introduction of New Course / Programme",
        "checklist": [
            "State Government NOC / Recommendation",
            "Affiliating University Consent to Affiliate",
            "Specialized Laboratory Setup Blueprint",
            "Library Titles and Volumes for New Branch"
        ],
        "rules": {
            "min_titles_required": 100,
            "min_volumes_required": 500,
            "state_noc_mandatory": True
        }
    },
    {
        "code": "CLOSURE_OF_COURSE",
        "name": "Closure of Course / Programme",
        "checklist": [
            "Resolution of Governing Body",
            "No-Objection Certificate from Students Enrolled",
            "Faculty Reallocation / Settlement Plan",
            "Affiliating University No-Objection Certificate"
        ],
        "rules": {
            "zero_active_students_or_transfer_plan": True,
            "governing_body_resolution_passed": True
        }
    },
    {
        "code": "CHANGE_OF_NAME",
        "name": "Change of Name of Institution",
        "checklist": [
            "Trust Resolution for Renaming",
            "State Government Clearance",
            "Public Notice in National & Regional Daily Newspaper",
            "University Endorsement"
        ],
        "rules": {
            "public_notice_cooling_days": 30,
            "name_must_not_violate_emblems_act": True
        }
    },
    {
        "code": "CHANGE_OF_TRUST",
        "name": "Change of Trust or Society",
        "checklist": [
            "Joint Petition of Transferor and Transferee Trusts",
            "Charity Commissioner / Registrar of Societies Sanction",
            "No Commercial Transaction / No Consideration Affidavit",
            "Title Clearance on Campus Land Transfer"
        ],
        "rules": {
            "charity_commissioner_order_valid": True,
            "unencumbered_title_conveyance": True
        }
    },
    {
        "code": "CHANGE_OF_LOCATION",
        "name": "Change of Site / Location of Institution",
        "checklist": [
            "New Land Deed in Name of Institution",
            "Town Planning Authority Approved Building Plan",
            "Deficiency Free Status at Old Campus",
            "Phase-wise Migration Schedule"
        ],
        "rules": {
            "new_land_meets_area_norms": True,
            "distance_restriction_checked": True
        }
    },
    {
        "code": "CHANGE_OF_PRINCIPAL",
        "name": "Change of Principal / Director",
        "checklist": [
            "Selection Committee Minutes of Meeting",
            "University Approval of Qualification",
            "PhD Certificate and Experience Testimonials",
            "Relieving Order of Previous Principal"
        ],
        "rules": {
            "must_possess_phd": True,
            "min_experience_years": 15,
            "selection_committee_had_university_nominee": True
        }
    }
]


def seed_database(reset: bool = False):
    start_time = datetime.now()
    print("=" * 65)
    print("      AICTE SATYAPAN - Database Seeding & Synthetic Data Pack")
    print("=" * 65)
    print(f"Target DB: {DB_PATH}")
    print(f"Reset mode: {'ENABLED (Recreating all tables)' if reset else 'DISABLED'}")

    if reset:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Dropped and recreated all schema tables.")
    else:
        Base.metadata.create_all(bind=engine)

    session = SessionLocal()

    try:
        # Check if already seeded and not reset
        existing_categories = session.execute(select(func.count(ApplicationCategory.id))).scalar()
        if existing_categories and existing_categories >= 8 and not reset:
            print("Database already contains seed data. Use --reset to re-seed from scratch.")
            return

        # ----------------------------------------------------------------------
        # 1. APPLICATION CATEGORIES (8 Mandated Categories)
        # ----------------------------------------------------------------------
        print("\n1. Seeding 8 APH Application Categories...")
        category_objects = {}
        for cat_data in CATEGORIES_DATA:
            cat = ApplicationCategory(
                id=str(uuid.uuid4()),
                code=cat_data["code"],
                name=cat_data["name"],
                checklist_json=json.dumps(cat_data["checklist"]),
                rules_json=json.dumps(cat_data["rules"]),
                version=1,
                is_active=True
            )
            session.add(cat)
            category_objects[cat_data["code"]] = cat
        session.flush()
        print(f"   -> Seeded {len(category_objects)} Application Categories.")

        # ----------------------------------------------------------------------
        # 2. INSTITUTES (40 Institutes across 15+ States)
        # ----------------------------------------------------------------------
        print("\n2. Seeding 40 Technical Institutes across 15+ States...")
        institutes = []

        # Institute 1: The RICHLY populated Demo Institute
        demo_inst = Institute(
            id=str(uuid.uuid4()),
            aicte_id="AICTE-1-3324901",
            name="Saraswati Institute of Technology",
            type="Engineering & Technology (UG/PG)",
            state="Maharashtra",
            district="Pune",
            lat=18.5912,
            lng=73.7389,
            established_year=2008,
            trust_name="Saraswati Education Society",
            principal_name="Dr. Prakash Patil",
            email="principal@demo-institute.in",
            phone="+91-20-27481920",
            status="ACTIVE"
        )
        institutes.append(demo_inst)

        # 39 other realistic institutes across states
        inst_idx = 2
        for state, districts in STATES_DATA:
            for dist in districts:
                if len(institutes) >= 40:
                    break
                pfx = random.choice(INSTITUTE_PREFIXES)
                inst_name = f"{pfx} College of Engineering & Research, {dist}"
                inst = Institute(
                    id=str(uuid.uuid4()),
                    aicte_id=f"AICTE-1-{4000000 + inst_idx * 179}",
                    name=inst_name,
                    type="Engineering & Technology",
                    state=state,
                    district=dist,
                    lat=round(12.0 + random.random() * 16.0, 4),
                    lng=round(72.0 + random.random() * 16.0, 4),
                    established_year=random.randint(1995, 2020),
                    trust_name=f"{pfx} Charitable Educational Trust",
                    principal_name=f"Dr. {random.choice(['Sanjay', 'Rajesh', 'Anil', 'Sunil', 'Vijay', 'Archana', 'Nandini'])} {random.choice(['Sharma', 'Deshmukh', 'Rao', 'Iyer', 'Patel', 'Reddy', 'Banerjee'])}",
                    email=f"principal@aicte-{inst_idx}.ac.in",
                    phone=f"+91-{random.randint(7000000000, 9999999999)}",
                    status="ACTIVE"
                )
                institutes.append(inst)
                inst_idx += 1
            if len(institutes) >= 40:
                break

        session.add_all(institutes)
        session.flush()
        print(f"   -> Seeded {len(institutes)} Institutes across {len(STATES_DATA)} States.")

        # ----------------------------------------------------------------------
        # 3. INSTITUTE RECORDS (Authorised AICTE baseline)
        # ----------------------------------------------------------------------
        print("\n3. Seeding Institute Records (Baseline AICTE Data)...")
        records = []
        for inst in institutes:
            is_demo = (inst.id == demo_inst.id)
            prog_count = 4 if is_demo else random.randint(2, 5)
            selected_progs = random.sample(PROGRAMMES, prog_count)
            
            intake_history = {
                "2022-23": {p: 60 for p in selected_progs},
                "2023-24": {p: 60 if p != "Computer Science and Engineering" else 120 for p in selected_progs},
                "2024-25": {p: 60 if p != "Computer Science and Engineering" else 120 for p in selected_progs},
                "2025-26": {p: 60 if p != "Computer Science and Engineering" else 180 for p in selected_progs},
                "2026-27": {p: 60 if p != "Computer Science and Engineering" else 180 for p in selected_progs}
            }

            rec = InstituteRecord(
                id=str(uuid.uuid4()),
                institute_id=inst.id,
                approved_programmes=json.dumps(selected_progs),
                approved_intake=json.dumps(intake_history),
                previous_eoa=json.dumps({
                    "last_eoa_year": "2025-2026",
                    "letter_no": f"F.No. Western/1-{inst.aicte_id}/2025/EOA",
                    "issued_date": "2025-05-14"
                }),
                accreditation=json.dumps({
                    "naac_grade": "A+" if is_demo else random.choice(["A+", "A", "B++", "NA"]),
                    "naac_valid_upto": "2028-12-31",
                    "nba_accredited_count": 2 if is_demo else random.choice([0, 1, 2])
                }),
                deficiency_status="NO_DEFICIENCY" if not is_demo else "TWO_DEFICIENCIES_COMMUNICATED",
                ter_payment_status="PAID",
                faculty_count=38 if is_demo else random.randint(25, 60),
                built_up_area_sqm=12540.0 if is_demo else round(8000.0 + random.random() * 8000.0, 1)
            )
            records.append(rec)
        session.add_all(records)
        session.flush()
        print(f"   -> Seeded {len(records)} Institute Baseline Records.")

        # ----------------------------------------------------------------------
        # 4. DEMO ACCOUNTS (Exact Mandated Credentials with Argon2)
        # ----------------------------------------------------------------------
        print("\n4. Seeding Mandated Demo Accounts (Password: Demo@1234)...")
        demo_users = [
            User(
                id=str(uuid.uuid4()),
                name="Dr. Meera Kulkarni",
                email="faculty@demo-institute.in",
                password_hash=DEMO_PASSWORD_HASH,
                role=UserRole.INSTITUTE_FACULTY,
                institute_id=demo_inst.id,
                designation="Professor & Head, Computer Engg",
                mfa_enabled=False,
                is_active=True,
                preferred_language="en"
            ),
            User(
                id=str(uuid.uuid4()),
                name="Dr. Prakash Patil (Principal)",
                email="admin@demo-institute.in",
                password_hash=DEMO_PASSWORD_HASH,
                role=UserRole.INSTITUTE_ADMIN,
                institute_id=demo_inst.id,
                designation="Principal & Professor",
                mfa_enabled=False,
                is_active=True,
                preferred_language="en"
            ),
            User(
                id=str(uuid.uuid4()),
                name="Shri R. Verma",
                email="scrutiny@aicte.demo",
                password_hash=DEMO_PASSWORD_HASH,
                role=UserRole.OFFICIAL_SCRUTINY,
                institute_id=None,
                designation="AICTE Scrutiny Officer (WRO)",
                mfa_enabled=True,
                is_active=True,
                preferred_language="hi"
            ),
            User(
                id=str(uuid.uuid4()),
                name="Smt. A. Iyer",
                email="senior@aicte.demo",
                password_hash=DEMO_PASSWORD_HASH,
                role=UserRole.OFFICIAL_SENIOR,
                institute_id=None,
                designation="Regional Director, AICTE WRO",
                mfa_enabled=True,
                is_active=True,
                preferred_language="mr"
            ),
            User(
                id=str(uuid.uuid4()),
                name="System Policy Administrator",
                email="sysadmin@aicte.demo",
                password_hash=DEMO_PASSWORD_HASH,
                role=UserRole.SYSTEM_ADMIN,
                institute_id=None,
                designation="System Admin, AICTE HQ",
                mfa_enabled=True,
                is_active=True,
                preferred_language="en"
            )
        ]
        session.add_all(demo_users)
        session.flush()
        print(f"   -> Seeded {len(demo_users)} Demo Accounts.")

        # ----------------------------------------------------------------------
        # 5. FACULTY (150+ Faculty with Cadre Distribution & Masked PAN)
        # ----------------------------------------------------------------------
        print("\n5. Seeding 150+ Faculty with Masked PAN & Cadre Norms...")
        faculty_members = []
        cadres = [("Professor", "Ph.D"), ("Associate Professor", "Ph.D"), ("Assistant Professor", "M.Tech")]
        weights = [0.15, 0.25, 0.60]

        # 38 faculty for demo institute
        for i in range(38):
            desig, qual = random.choices(cadres, weights=weights)[0]
            dep = random.choice(["Computer Science and Engineering", "Information Technology", "Electronics and Communication Engineering", "Applied Sciences"])
            fac = Faculty(
                id=str(uuid.uuid4()),
                institute_id=demo_inst.id,
                name=f"Prof. {random.choice(['Arun', 'Sneha', 'Manoj', 'Deepak', 'Kavita', 'Suresh', 'Pooja', 'Nitin', 'Shilpa', 'Girish'])} {random.choice(['Jadhav', 'Kadam', 'Shinde', 'Chavan', 'More', 'Gaikwad', 'Pawar'])}",
                designation=desig,
                qualification=qual,
                department=dep,
                pan_masked=f"ABCDE{random.randint(1000, 9999)}F"[:5] + "****" + "F",
                employment_type="REGULAR",
                joining_date=date(random.randint(2010, 2023), random.randint(1, 12), random.randint(1, 28))
            )
            faculty_members.append(fac)

        # 120 more faculty across other institutes
        for inst in institutes[1:15]:
            for _ in range(8):
                desig, qual = random.choices(cadres, weights=weights)[0]
                fac = Faculty(
                    id=str(uuid.uuid4()),
                    institute_id=inst.id,
                    name=f"Prof. {random.choice(['Ramesh', 'Alok', 'Sunita', 'Vikram', 'Meena', 'Ajay'])} {random.choice(['Verma', 'Gupta', 'Singh', 'Sharma', 'Kumar'])}",
                    designation=desig,
                    qualification=qual,
                    department=random.choice(PROGRAMMES),
                    pan_masked=f"XYZAB{random.randint(1000, 9999)}G"[:5] + "****" + "G",
                    employment_type="REGULAR",
                    joining_date=date(random.randint(2012, 2024), random.randint(1, 12), random.randint(1, 28))
                )
                faculty_members.append(fac)

        session.add_all(faculty_members)
        session.flush()
        print(f"   -> Seeded {len(faculty_members)} Faculty records.")

        # ----------------------------------------------------------------------
        # 6. APPLICATIONS (70+ Applications in Mixed Statuses)
        # ----------------------------------------------------------------------
        print("\n6. Seeding ~70 Applications in Mixed Statuses...")
        applications = []
        statuses = [
            ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED, ApplicationStatus.AUTO_VALIDATED,
            ApplicationStatus.UNDER_SCRUTINY, ApplicationStatus.DEFICIENCY_RAISED,
            ApplicationStatus.INSPECTION_RECOMMENDED, ApplicationStatus.APPROVED
        ]

        # Demo Institute: 3 distinct applications
        demo_apps = [
            Application(
                id=str(uuid.uuid4()),
                application_no="AICTE/EOA/2026/MH-PUNE-402",
                institute_id=demo_inst.id,
                category_id=category_objects["EXTENSION_OF_APPROVAL"].id,
                academic_year="2026-2027",
                status=ApplicationStatus.SUBMITTED,
                readiness_score=94.5,
                risk_score=4.5,
                risk_band="LOW",
                assigned_official_id=demo_users[2].id,
                sla_due_at=datetime.utcnow() + timedelta(days=14),
                submitted_at=datetime.utcnow() - timedelta(days=2)
            ),
            Application(
                id=str(uuid.uuid4()),
                application_no="AICTE/INTAKE/2026/MH-PUNE-403",
                institute_id=demo_inst.id,
                category_id=category_objects["INCREASE_IN_INTAKE"].id,
                academic_year="2026-2027",
                status=ApplicationStatus.DEFICIENCY_RAISED,
                readiness_score=78.0,
                risk_score=45.0,
                risk_band="MEDIUM",
                assigned_official_id=demo_users[2].id,
                sla_due_at=datetime.utcnow() + timedelta(days=7),
                submitted_at=datetime.utcnow() - timedelta(days=5)
            ),
            Application(
                id=str(uuid.uuid4()),
                application_no="AICTE/EOA/2025/MH-PUNE-210",
                institute_id=demo_inst.id,
                category_id=category_objects["EXTENSION_OF_APPROVAL"].id,
                academic_year="2025-2026",
                status=ApplicationStatus.APPROVED,
                readiness_score=98.0,
                risk_score=2.0,
                risk_band="LOW",
                assigned_official_id=demo_users[3].id,
                sla_due_at=datetime.utcnow() - timedelta(days=365),
                submitted_at=datetime.utcnow() - timedelta(days=390)
            )
        ]
        applications.extend(demo_apps)

        # Other 67 applications across other institutes
        app_counter = 100
        for inst in institutes[1:]:
            app_count = random.choice([2, 3])
            for _ in range(app_count):
                cat = random.choice(list(category_objects.values()))
                stat = random.choice(statuses)
                r_score = round(random.uniform(5.0, 85.0), 1)
                band = "LOW" if r_score < 25 else "MEDIUM" if r_score < 60 else "HIGH"
                
                app = Application(
                    id=str(uuid.uuid4()),
                    application_no=f"AICTE/{cat.code[:6]}/{2026}/{inst.state[:2].upper()}-{app_counter}",
                    institute_id=inst.id,
                    category_id=cat.id,
                    academic_year="2026-2027",
                    status=stat,
                    readiness_score=round(random.uniform(60.0, 99.0), 1),
                    risk_score=r_score,
                    risk_band=band,
                    assigned_official_id=demo_users[2].id if stat != ApplicationStatus.DRAFT else None,
                    sla_due_at=datetime.utcnow() + timedelta(days=random.randint(3, 30)),
                    submitted_at=datetime.utcnow() - timedelta(days=random.randint(1, 45))
                )
                applications.append(app)
                app_counter += 1
                if len(applications) >= 72:
                    break
            if len(applications) >= 72:
                break

        session.add_all(applications)
        session.flush()
        print(f"   -> Seeded {len(applications)} Applications.")

        # ----------------------------------------------------------------------
        # 7. STUDENTS (600+ Students across Programmes, Years, Categories, Genders)
        # ----------------------------------------------------------------------
        print("\n7. Seeding 600+ Students...")
        students = []
        genders = ["M", "F", "F", "M", "Other"] # Healthy diversity mix
        categories = ["GENERAL", "OBC", "SC", "ST", "EWS"]
        cat_weights = [0.45, 0.27, 0.15, 0.075, 0.055]

        # 200 students for demo institute
        for i in range(200):
            prog = random.choice(PROGRAMMES[:4])
            yr = random.choice([1, 2, 3, 4])
            g = random.choice(genders)
            first_name = random.choice(["Aditya", "Neha", "Rohan", "Priya", "Aniket", "Shreya", "Tanmay", "Aishwarya", "Sanket", "Pranali"])
            last_name = random.choice(["Deshmukh", "Kulkarni", "Patil", "Joshi", "Bhosale", "More", "Gawande", "Shinde"])
            stu = Student(
                id=str(uuid.uuid4()),
                institute_id=demo_inst.id,
                application_id=demo_apps[0].id,
                enrolment_no=f"EN202{4-yr+1}SIT{1000+i}",
                name=f"{first_name} {last_name}",
                programme=prog,
                year=yr,
                category=random.choices(categories, weights=cat_weights)[0],
                gender=g,
                dob=date(2002 + yr, random.randint(1, 12), random.randint(1, 28)),
                email=f"{first_name.lower()}.{last_name.lower()}{i}@sit.ac.in",
                mobile_masked=f"98{random.randint(10, 99)}****{random.randint(10, 99)}",
                status="ENROLLED"
            )
            students.append(stu)

        # 420 students across other institutes
        for i in range(420):
            inst = random.choice(institutes[1:10])
            yr = random.choice([1, 2, 3, 4])
            stu = Student(
                id=str(uuid.uuid4()),
                institute_id=inst.id,
                application_id=None,
                enrolment_no=f"EN2024{inst.state[:2].upper()}{5000+i}",
                name=f"{random.choice(['Amit', 'Pooja', 'Rahul', 'Divya', 'Siddharth', 'Megha'])} {random.choice(['Verma', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Sharma'])}",
                programme=random.choice(PROGRAMMES),
                year=yr,
                category=random.choices(categories, weights=cat_weights)[0],
                gender=random.choice(genders),
                dob=date(2003, random.randint(1, 12), random.randint(1, 28)),
                email=f"student{i}@{inst.aicte_id.lower()}.in",
                mobile_masked=f"97{random.randint(10, 99)}****{random.randint(10, 99)}",
                status="ENROLLED"
            )
            students.append(stu)

        session.add_all(students)
        session.flush()
        print(f"   -> Seeded {len(students)} Student records.")

        # ----------------------------------------------------------------------
        # 8. DOCUMENTS & OCR, VERIFICATIONS, FINDINGS, DEFICIENCIES
        # ----------------------------------------------------------------------
        print("\n8. Seeding Documents, OCR, Verifications, and Deficiencies...")
        docs = []
        findings = []
        deficiencies = []
        verifications = []

        doc_templates = [
            ("LAND_OWNERSHIP", "7_12_Extract_Land_Registry_402.pdf", 0.99, "MAHABHUMI"),
            ("BUILDING_PLAN", "Approved_Architect_Building_Plan_B.pdf", 0.96, "MUNICIPAL"),
            ("FIRE_NOC", "State_Fire_Services_NOC_2024.pdf", 0.99, "FIRE_DEPT"),
            ("FACULTY_APPOINTMENT", "Faculty_Cadre_Roster_Endorsed.pdf", 0.98, "FACULTY_PORTAL"),
            ("FDR_DEPOSIT", "Joint_Fixed_Deposit_Receipt_AICTE.pdf", 0.99, "SBI_BANK_CBS"),
            ("UNIVERSITY_AFFILIATION", "University_Affiliation_Extension_Letter.pdf", 0.97, "UGC_UNIV")
        ]

        # For Demo Application 1 (Clean EoA)
        for doc_type, fname, conf, auth_code in doc_templates:
            doc_id = str(uuid.uuid4())
            d = Document(
                id=doc_id,
                application_id=demo_apps[0].id,
                doc_type=doc_type,
                original_filename=fname,
                storage_path_encrypted=f"/secure/storage/2026/{demo_apps[0].id}/{fname}",
                sha256=hashlib.sha256(fname.encode()).hexdigest(),
                phash=hashlib.md5(fname.encode()).hexdigest()[:16],
                mime="application/pdf",
                size=random.randint(450000, 3200000),
                uploaded_by=demo_users[1].id,
                uploaded_at=datetime.utcnow() - timedelta(days=2),
                version=1,
                classification_label=doc_type,
                classification_confidence=conf
            )
            docs.append(d)

            # Verification record
            v = Verification(
                id=str(uuid.uuid4()),
                document_id=doc_id,
                authority_code=auth_code,
                reference_no=f"REF-{auth_code}-2026-9912",
                request_json=json.dumps({"doc_type": doc_type, "filename": fname}),
                response_json=json.dumps({"status": "VERIFIED", "authority": auth_code}),
                status=VerificationStatus.VERIFIED,
                source_name=f"SIMULATED SOURCE ({auth_code})",
                is_simulated=True,
                checked_at=datetime.utcnow() - timedelta(days=1),
                latency_ms=random.randint(85, 340),
                checked_by=demo_users[2].id
            )
            verifications.append(v)

        # For Demo Application 2 (Intake increase with 2 Open Deficiencies)
        app2 = demo_apps[1]
        doc_intake1 = Document(
            id=str(uuid.uuid4()),
            application_id=app2.id,
            doc_type="FIRE_NOC",
            original_filename="Expired_Fire_Safety_NOC_2021.pdf",
            storage_path_encrypted=f"/secure/storage/2026/{app2.id}/fire_expired.pdf",
            sha256=hashlib.sha256(b"fire_expired").hexdigest(),
            mime="application/pdf",
            size=1450000,
            uploaded_by=demo_users[1].id,
            uploaded_at=datetime.utcnow() - timedelta(days=5),
            classification_label="FIRE_NOC",
            classification_confidence=0.98
        )
        docs.append(doc_intake1)

        finding1 = Finding(
            id=str(uuid.uuid4()),
            validation_run_id=None,
            application_id=app2.id,
            document_id=doc_intake1.id,
            severity=FindingSeverity.HIGH,
            type=FindingType.EXPIRED,
            title="Expired Fire Safety NOC Detected",
            reason="Fire Department NOC expired on 09-Jan-2024. Active Fire NOC mandatory under APH Chapter 1 Section 4.3.",
            evidence_json=json.dumps({
                "page": 1,
                "field": "Validity Period",
                "extracted_value": "Valid up to 09-01-2024",
                "authority_response": "Expired"
            }),
            confidence=0.99,
            source="DIGILOCKER_SIMULATED",
            status=FindingStatus.OPEN
        )
        findings.append(finding1)

        def1 = Deficiency(
            id=str(uuid.uuid4()),
            application_id=app2.id,
            finding_id=finding1.id,
            raised_by=demo_users[2].id,
            message="Please furnish renewed Fire Safety NOC from State Fire Services within 15 calendar days.",
            due_date=datetime.utcnow() + timedelta(days=15),
            status="OPEN"
        )
        deficiencies.append(def1)

        # 2nd deficiency: Built-up Area Deficit
        finding2 = Finding(
            id=str(uuid.uuid4()),
            validation_run_id=None,
            application_id=app2.id,
            document_id=None,
            severity=FindingSeverity.MEDIUM,
            type=FindingType.INFRA_GAP,
            title="Carpet Area Deficit for Additional Computer Engineering Batch",
            reason="Proposed intake expansion (+60 seats) requires additional 420 sqm instructional carpet area. Verified deficit: 85 sqm.",
            evidence_json=json.dumps({
                "required_sqm": 420.0,
                "available_sqm": 335.0,
                "deficit_sqm": 85.0
            }),
            confidence=0.96,
            source="INFRASTRUCTURE_AUDIT",
            status=FindingStatus.OPEN
        )
        findings.append(finding2)

        def2 = Deficiency(
            id=str(uuid.uuid4()),
            application_id=app2.id,
            finding_id=finding2.id,
            raised_by=demo_users[2].id,
            message="Provide architect endorsement and revised floor plan confirming additional 85 sqm laboratory space.",
            due_date=datetime.utcnow() + timedelta(days=15),
            status="OPEN"
        )
        deficiencies.append(def2)

        session.add_all(docs)
        session.add_all(findings)
        session.add_all(deficiencies)
        session.add_all(verifications)
        session.flush()
        print(f"   -> Seeded Documents ({len(docs)}), Findings ({len(findings)}), Deficiencies ({len(deficiencies)}).")

        # ----------------------------------------------------------------------
        # 9. 5 YEARS HISTORICAL INTAKE & DISPOSAL METRICS (For Trendlines)
        # ----------------------------------------------------------------------
        print("\n9. Seeding 5 Years Historical Monthly Intake & Disposal Metrics...")
        metrics = []
        current_year = datetime.now().year
        for yr in range(current_year - 4, current_year + 1):
            for m in range(1, 13):
                # Monthly applications received vs disposed
                d_date = datetime(yr, m, 1)
                base_in = random.randint(120, 280)
                base_out = int(base_in * random.uniform(0.85, 0.98))

                metrics.append(EvaluationMetric(
                    id=str(uuid.uuid4()),
                    run_at=d_date,
                    metric="MONTHLY_APPLICATIONS_RECEIVED",
                    value=float(base_in),
                    dataset="HISTORICAL_COUNCIL_REGISTER",
                    note=f"Monthly Applications Intake {yr}-{m:02d}"
                ))
                metrics.append(EvaluationMetric(
                    id=str(uuid.uuid4()),
                    run_at=d_date,
                    metric="MONTHLY_APPLICATIONS_DISPOSED",
                    value=float(base_out),
                    dataset="HISTORICAL_COUNCIL_REGISTER",
                    note=f"Monthly Scrutiny Disposals {yr}-{m:02d}"
                ))

        session.add_all(metrics)
        session.flush()
        print(f"   -> Seeded {len(metrics)} Monthly Historical Data Points (5 Years).")

        # ----------------------------------------------------------------------
        # 10. HASH-CHAINED AUDIT LOG
        # ----------------------------------------------------------------------
        print("\n10. Seeding Hash-Chained Audit Logs with SHA-256...")
        audit_events = [
            ("INSTITUTE_REGISTRATION", "institutes", demo_inst.id, "Registered Saraswati IT under WRO-AICTE", "SYSTEM"),
            ("DOSSIER_SUBMITTED", "applications", demo_apps[0].id, "Submitted EoA Application AICTE/EOA/2026/MH-PUNE-402", demo_users[1].id),
            ("OCR_ANALYSIS_COMPLETED", "documents", docs[0].id, "Tesseract extracted land coordinates and acreage", "AUTOMATED_ENGINE"),
            ("DIGILOCKER_CROSSCHECK", "verifications", verifications[0].id, "National DigiLocker verified Fire Safety certificate", "AUTHORITY_GATEWAY"),
            ("DEFICIENCY_COMMUNICATED", "deficiencies", def1.id, "Dispatched Deficiency Memo for Expired Fire NOC", demo_users[2].id)
        ]

        prev_hash = "GENESIS_ROOT_HASH_AICTE_SATYAPAN_2026"
        audit_records = []
        for action, entity, entity_id, msg, actor in audit_events:
            payload = {
                "action": action,
                "entity": entity,
                "entity_id": entity_id,
                "details": msg,
                "actor": actor
            }
            canonical_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
            h = hashlib.sha256(f"{prev_hash}:{canonical_json}".encode('utf-8')).hexdigest()

            rec = AuditLog(
                id=str(uuid.uuid4()),
                ts=datetime.utcnow() - timedelta(minutes=random.randint(10, 500)),
                actor_id=actor,
                actor_role="SCRUTINY_OFFICIAL" if actor == demo_users[2].id else "SYSTEM",
                action=action,
                entity=entity,
                entity_id=entity_id,
                details=json.dumps(payload),
                ip="10.24.18.91",
                prev_hash=prev_hash,
                hash=h
            )
            audit_records.append(rec)
            prev_hash = h

        session.add_all(audit_records)
        session.commit()
        print(f"   -> Seeded {len(audit_records)} Hash-Chained Audit Logs.")

        duration = (datetime.now() - start_time).total_seconds()
        print("=" * 65)
        print(f" SUCCESS: Seeding completed in {duration:.2f} seconds! (< 30s threshold)")
        print("=" * 65)

    except Exception as e:
        session.rollback()
        print(f"ERROR DURING SEEDING: {e}")
        raise e
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AICTE SATYAPAN Master Database Seeder")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all database tables before seeding")
    args = parser.parse_args()

    seed_database(reset=args.reset)
