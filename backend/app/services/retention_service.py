from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.models.schemas import DataAccessLog, AuditLog
from app.core.audit import write_audit_event


class DataRetentionService:
    def __init__(self, db: Session):
        self.db = db

    def purge_expired_access_logs(self, retention_days: int = 90) -> Dict[str, Any]:
        """
        Regulatory data retention job:
        Purges transient data access logs older than `retention_days`.
        Note: The cryptographic AuditLog chain is immutable and is NEVER purged.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

        stmt = select(DataAccessLog).where(DataAccessLog.created_at < cutoff_date)
        res = self.db.execute(stmt)
        expired_logs = res.scalars().all()
        purged_count = len(expired_logs)

        if purged_count > 0:
            del_stmt = delete(DataAccessLog).where(DataAccessLog.created_at < cutoff_date)
            self.db.execute(del_stmt)

            # Record retention action in immutable audit log
            write_audit_event(
                session=self.db,
                actor_id=None,
                actor_role="SYSTEM_RETENTION_DAEMON",
                action="DATA_RETENTION_JOB_EXECUTED",
                entity="data_access_log",
                entity_id="BULK_PURGE",
                details={
                    "retention_days": retention_days,
                    "purged_records_count": purged_count,
                    "cutoff_date": cutoff_date.isoformat()
                }
            )
            self.db.commit()

        return {
            "status": "success",
            "purged_count": purged_count,
            "retention_days": retention_days,
            "cutoff_date": cutoff_date.isoformat(),
            "message": f"Data retention executed: {purged_count} expired access logs purged."
        }
