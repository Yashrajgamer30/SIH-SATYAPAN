from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from datetime import datetime
from app.models.schemas import User


class AuthRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.strip().lower())
        res = self.session.execute(stmt)
        return res.scalar_one_or_none()

    def get_by_id(self, user_id: str) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        res = self.session.execute(stmt)
        return res.scalar_one_or_none()

    def update_last_login(self, user_id: str):
        stmt = update(User).where(User.id == user_id).values(last_login=datetime.utcnow())
        self.session.execute(stmt)
        self.session.flush()
