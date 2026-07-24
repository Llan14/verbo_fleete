from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    nombre: str
    apellidos: str
    email: EmailStr
    rol: Optional[str] = "estudiante"

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdatePassword(BaseModel):
    password_actual: str
    password_nueva: str

class UsuarioResponse(UsuarioBase):
    id: int
    is_active: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class UsuarioResetPasswordAdmin(BaseModel):
    nueva_password: str

class UsuarioUpdateAdmin(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[str] = None


class AsignarHijoRequest(BaseModel):
    alumno_id: int


class AlumnoVinculadoResponse(BaseModel):
    id: int
    nombre: str
    apellidos: str
    email: EmailStr

    class Config:
        from_attributes = True


class HijoProgresoResponse(BaseModel):
    id: int
    nombre: str
    apellidos: str
    email: EmailStr
    progreso: int
    ultima_actividad: datetime | None