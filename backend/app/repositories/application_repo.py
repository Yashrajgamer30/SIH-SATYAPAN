from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.schemas import Application, Document, Finding, Deficiency, Institute
from app.models.enums import ApplicationStatus


class ApplicationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id_isolated(self, application_id: str, institute_id: Optional[str] = None) -> Optional[Application]:
        """
        Enforces Row-Level Institute Isolation:
        If institute_id is provided, guarantees that an application belonging to
        another institute CANNOT be read (prevents IDOR vulnerabilities).
        """
        filters = [Application.id == application_id]
        if institute_id:
            filters.append(Application.institute_id == institute_id)

        stmt = select(Application).where(and_(*filters))
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_by_institute(self, institute_id: str) -> List[Application]:
        stmt = select(Application).where(Application.institute_id == institute_id).order_by(Application.created_at.desc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_for_officials(self, status: Optional[ApplicationStatus] = None, limit: int = 50) -> List[Application]:
        stmt = select(Application)
        if status:
            stmt = stmt.where(Application.status == status)
        stmt = stmt.order_by(Application.risk_score.desc(), Application.created_at.desc()).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_institute_deficiencies(self, institute_id: str) -> List[Deficiency]:
        stmt = select(Deficiency).join(Application).where(
            and_(Application.institute_id == institute_id, Deficiency.status == "OPEN")
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
