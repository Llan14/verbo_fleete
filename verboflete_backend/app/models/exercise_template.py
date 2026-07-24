from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class ExerciseTemplate(Base):
    __tablename__ = "exercise_templates"

    id = Column(Integer, primary_key=True, index=True)
    module = Column(String(50), nullable=False, index=True)
    level = Column(String(10), nullable=True)
    prompt_context = Column(String(255), nullable=True)
    payload = Column(JSON, nullable=False)
    version = Column(String(20), nullable=False, default="v1")
    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    creator = relationship("Usuario")
    assignments = relationship("Assignment", back_populates="template")
    practice_sessions = relationship("PracticeSession", back_populates="template")
