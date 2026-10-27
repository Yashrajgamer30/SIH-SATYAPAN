"""
SATYAPAN - ML Module 7: Tabular Regulatory Anomaly Detection
Uses IsolationForest on institutional application parameters:
- Student Intake vs Faculty Count (FSR)
- Built-up Carpet Area per Student (sq.m / student)
- Document Expiry Spread (days to nearest expiry)
- Cumulative Severity Finding Count
"""

import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest

# Benchmark feature norms under AICTE Approval Process Handbook (APH)
FEATURE_NAMES = [
    "fsr_ratio",
    "area_per_student_sqm",
    "days_to_nearest_expiry",
    "finding_count",
    "ter_fee_verified"
]


def detect_tabular_anomalies(features: Dict[str, float]) -> Dict[str, Any]:
    """
    Evaluates application vector against IsolationForest model.
    Returns anomaly score (-1 to 1, normalized to 0-100), flag, and top contributing drivers.
    """
    # Sample baseline vectors representing typical compliant AICTE colleges
    normal_corpus = np.array([
        [15.0, 14.5, 360, 0, 1.0],
        [17.5, 12.0, 240, 1, 1.0],
        [16.0, 15.0, 480, 0, 1.0],
        [18.2, 11.5, 180, 1, 1.0],
        [19.0, 13.0, 90, 2, 1.0]
    ])

    iso_forest = IsolationForest(contamination=0.10, random_state=42)
    iso_forest.fit(normal_corpus)

    test_vec = np.array([[
        features.get("fsr_ratio", 15.0),
        features.get("area_per_student_sqm", 14.5),
        features.get("days_to_nearest_expiry", 240),
        features.get("finding_count", 0),
        features.get("ter_fee_verified", 1.0)
    ]])

    raw_score = iso_forest.decision_function(test_vec)[0]  # Higher is normal, lower is anomalous
    # Normalize: normal (+0.2) -> 15% risk; anomalous (-0.2) -> 85% risk
    anomaly_risk_score = round(float(np.clip((0.25 - raw_score) * 150, 5.0, 95.0)), 1)
    is_anomalous = anomaly_risk_score > 60.0

    contributions = []
    if features.get("fsr_ratio", 15.0) > 20.0:
        contributions.append(f"Faculty-Student Ratio ({features.get('fsr_ratio'):.1f}:1) breaches max norm 1:20.")
    if features.get("area_per_student_sqm", 14.5) < 10.0:
        contributions.append("Built-up area per student is below statutory 10 sq.m threshold.")
    if features.get("days_to_nearest_expiry", 240) < 30:
        contributions.append("Critical statutory certificate expires within 30 calendar days.")

    return {
        "anomaly_score": anomaly_risk_score,
        "is_anomalous": is_anomalous,
        "top_contributing_features": contributions if contributions else ["All application ratios conform to APH norms."],
        "model": "IsolationForest-APH-Norms"
    }
