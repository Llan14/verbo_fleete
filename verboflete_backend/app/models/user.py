from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship, backref
from .group import grupo_alumno_tabla, grupo_tutor_tabla


padre_alumno_tabla = Table(
    "padre_alumno",
    Base.metadata,
    Column("padre_id", Integer, ForeignKey("usuarios.id"), primary_key=True),
    Column("alumno_id", Integer, ForeignKey("usuarios.id"), primary_key=True),
)

# Definimos los roles para mantener consistencia en toda la aplicación.
# Esto evita errores por strings mágicos como "admin" o "Admin".
class Roles:
    ADMIN = "admin"
    TUTOR = "tutor"
    ESTUDIANTE = "estudiante"
    PADRES = "padres"


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

    hijos_asociados = relationship(
        "Usuario",
        secondary=padre_alumno_tabla,
        primaryjoin=id == padre_alumno_tabla.c.padre_id,
        secondaryjoin=id == padre_alumno_tabla.c.alumno_id,
        back_populates="padres_asociados",
    )

    padres_asociados = relationship(
        "Usuario",
        secondary=padre_alumno_tabla,
        primaryjoin=id == padre_alumno_tabla.c.alumno_id,
        secondaryjoin=id == padre_alumno_tabla.c.padre_id,
        back_populates="hijos_asociados",
    )