from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TeacherAssignmentCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    instructions: str | None = Field(default=None, max_length=500)
    group_id: int
    due_at: datetime
    weight: float = Field(default=1.0, ge=0.1, le=100)

    module: str | None = Field(default=None, max_length=50)
    nivel: str | None = Field(default=None, max_length=10)
    contexto: str | None = Field(default=None, max_length=255)

    draft_id: int | None = None
    payload: dict[str, Any] | None = None


class TeacherAssignmentCreateResponse(BaseModel):
    assignment_id: int
    recipients_count: int
    created_at: datetime


class TeacherAssignmentListItem(BaseModel):
    assignment_id: int
    title: str
    module: str
    group_id: int
    group_name: str
    due_at: datetime
    weight: float
    recipients_count: int
    submitted_count: int


class TeacherAssignmentRecipientResult(BaseModel):
    recipient_id: int
    student_id: int
    student_name: str
    student_email: str
    status: str
    submitted_at: datetime | None
    score: float | None


class TeacherGradeDeliveryItem(BaseModel):
    alumno_id: int
    alumno_nombre: str
    calificacion: float | None
    errores_frecuentes: str | None


class TeacherGradesByGroupItem(BaseModel):
    tarea_id: int
    titulo: str
    group_id: int
    entregas: list[TeacherGradeDeliveryItem]


class TeacherAssignmentResultsResponse(BaseModel):
    assignment_id: int
    title: str
    module: str
    group_name: str
    due_at: datetime
    weight: float
    submitted_count: int
    recipients_count: int
    average_score: float | None
    recipients: list[TeacherAssignmentRecipientResult]


class StudentAssignmentListItem(BaseModel):
    assignment_id: int
    recipient_id: int
    title: str
    module: str
    group_name: str
    due_at: datetime
    weight: float
    status: str
    submitted_at: datetime | None
    score: float | None


class StudentAssignmentDetailResponse(BaseModel):
    assignment_id: int
    recipient_id: int
    title: str
    instructions: str | None
    module: str
    group_name: str
    due_at: datetime
    weight: float
    status: str
    payload: dict[str, Any]


class SubmitAssignmentRequest(BaseModel):
    answers_payload: dict[str, Any]
    score: float | None = None


class SubmitAssignmentResponse(BaseModel):
    submission_id: int
    submitted_at: datetime
    status: str
    score: float | None


class PracticeSessionCreateRequest(BaseModel):
    module: str = Field(min_length=1, max_length=50)
    nivel: str | None = Field(default=None, max_length=10)
    contexto: str | None = Field(default=None, max_length=255)

    draft_id: int | None = None
    payload: dict[str, Any] | None = None
    answers_payload: dict[str, Any] | None = None
    score: float | None = None


class PracticeSessionCreateResponse(BaseModel):
    practice_session_id: int
    created_at: datetime
