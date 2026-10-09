import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON
from app.db import Base

# Use JSONB on Postgres, fallback JSON on sqlite dev
JSONType = JSON().with_variant(JSONB, "postgresql")

def uuid_default():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_default)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Company(Base):
    __tablename__ = "companies"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_default)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    sector: Mapped[str] = mapped_column(String(100), default="general")
    employee_count: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Assessment(Base):
    __tablename__ = "assessments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_default)
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), index=True)
    input_json = mapped_column(JSONType)
    risk_score: Mapped[float] = mapped_column(Float)
    risk_band: Mapped[str] = mapped_column(String(20))  # green/yellow/orange/red
    model_version: Mapped[str] = mapped_column(String(20), default="v0")
    top_factors = mapped_column(JSONType)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
