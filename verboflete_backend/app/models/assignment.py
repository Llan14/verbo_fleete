from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("exercise_templates.id"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("grupos.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    instructions = Column(String(500), nullable=True)
    due_at = Column(DateTime(timezone=True), nullable=False, index=True)
    weight = Column(Float, nullable=False, default=1.0)
    status = Column(String(30), nullable=False, default="published")
    created_by = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    template = relationship("ExerciseTemplate", back_populates="assignments")
    group = relationship("Grupo")
    creator = relationship("Usuario")
    recipients = relationship("AssignmentRecipient", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentRecipient(Base):
    __tablename__ = "assignment_recipients"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="pending")
    opened_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, nullable=True)

    assignment = relationship("Assignment", back_populates="recipients")
    student = relationship("Usuario")
    submission = relationship("Submission", back_populates="recipient", uselist=False, cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_recipient_id = Column(Integer, ForeignKey("assignment_recipients.id"), nullable=False, index=True)
    answers_payload = Column(JSON, nullable=False)
    feedback_payload = Column(JSON, nullable=True)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    recipient = relationship("AssignmentRecipient", back_populates="submission")


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("exercise_templates.id"), nullable=False, index=True)
    answers_payload = Column(JSON, nullable=True)
    feedback_payload = Column(JSON, nullable=True)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    student = relationship("Usuario")
    template = relationship("ExerciseTemplate", back_populates="practice_sessions")
