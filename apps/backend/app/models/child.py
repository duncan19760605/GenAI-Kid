import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey, CheckConstraint, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Child(Base):
    __tablename__ = "children"
    __table_args__ = (CheckConstraint("age BETWEEN 3 AND 8", name="check_age_range"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    primary_language: Mapped[str] = mapped_column(String(10), default="zh")
    learning_languages: Mapped[list] = mapped_column(JSON, default=lambda: ["en"])
    character_id: Mapped[str] = mapped_column(String(50), default="bear")
    login_code: Mapped[str | None] = mapped_column(String(6), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="children")
    conversations = relationship("Conversation", back_populates="child", cascade="all, delete-orphan")
