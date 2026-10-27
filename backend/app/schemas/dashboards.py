from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class KpiMetric(BaseModel):
    title: string = ""
    value: Any
    change: Optional[str] = None
    change_type: str = "neutral"
    subtitle: Optional[str] = None


class ChartSeriesPoint(BaseModel):
    label: str
    value: float
    secondary_value: Optional[float] = None


class InstituteDashboardResponse(BaseModel):
    institute_name: str
    aicte_id: str
    state: str
    district: str
    kpi_metrics: List[Dict[str, Any]]
    programme_intake_chart: List[Dict[str, Any]]
    active_applications: List[Dict[str, Any]]
    open_deficiencies: List[Dict[str, Any]]
    advisory_notice: str = "AI result is advisory. Final regulatory decisions are strictly authorized by designated AICTE Scrutiny Officials."


class OfficialDashboardResponse(BaseModel):
    official_name: str
    role: str
    kpi_metrics: List[Dict[str, Any]]
    monthly_trendlines: List[Dict[str, Any]]
    risk_distribution: Dict[str, int]
    pending_applications: List[Dict[str, Any]]
    recent_deficiencies: List[Dict[str, Any]]
    advisory_notice: str = "AI result is advisory. Final regulatory decisions are strictly authorized by designated AICTE Scrutiny Officials with mandatory written remarks."
