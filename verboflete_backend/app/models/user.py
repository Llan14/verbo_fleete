from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship, backref
from .group import grupo_alumno_tabla, grupo_tutor_tabla

# Definimos los roles para mantener consistencia en toda la aplicación.
# Esto evita errores por strings mágicos como "admin" o "Admin".
class Roles:
    ADMIN = "admin"
    TUTOR = "tutor"
    ESTUDIANTE = "estudiante"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(50), nullable=False)
    apellidos = Column(String(100), nullable=False)

    email = Column(String(100), unique=True, index=True, nullable=False)

    password_hash = Column(String(255), nullable=False)

    rol = Column(String(20), default=Roles.ESTUDIANTE)

    is_active = Column(Boolean, default=True)

    fecha_creacion = Column(DateTime(timezone=True), default=func.now())

    sesiones = relationship("Sesion", back_populates="usuario", cascade="all, delete-orphan")

    # Relación de un usuario (como alumno) a los grupos a los que pertenece.
    grupos_como_alumno = relationship(
        "Grupo",
        secondary=grupo_alumno_tabla,
        back_populates="alumnos"
    )

    # Relación de un usuario (como tutor) a los grupos que gestiona.
    grupos_como_tutor = relationship(
        "Grupo",
        secondary=grupo_tutor_tabla,
        back_populates="tutores"
    )