from typing import Any, Literal

from pydantic import BaseModel, Field


class ExerciseDraftCreateRequest(BaseModel):
    module: Literal["reading", "grammar", "speaking", "writing", "listening"]
    contexto: str = Field(min_length=1, max_length=255)
    nivel: str = Field(min_length=1, max_length=10)
    grupo_verbos: str = Field(min_length=1, max_length=120)
    mood: str = Field(min_length=1, max_length=50)
    tense: str = Field(min_length=1, max_length=50)


class ExerciseDraftResponse(BaseModel):
    draft_id: int
    module: str
    payload: dict[str, Any]
    generated_at: str
    version: str
