from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

# --- Tablas Asociativas (Muchos a Muchos) ---
# Estas tablas no son modelos de SQLAlchemy con una clase, sino una
# definición declarativa que SQLAlchemy usa para gestionar las relaciones M-M.

# Tabla para la relación Muchos a Muchos entre Grupos y Alumnos (Usuarios).
# Un grupo puede tener muchos alumnos y un alumno puede estar en muchos grupos.
grupo_alumno_tabla = Table('grupo_alumno', Base.metadata,
    Column('grupo_id', Integer, ForeignKey('grupos.id'), primary_key=True),
    Column('alumno_id', Integer, ForeignKey('usuarios.id'), primary_key=True)
)

# Tabla para la relación Muchos a Muchos entre Grupos y Tutores (Usuarios).
# Un grupo puede tener varios tutores y un tutor puede gestionar varios grupos.
grupo_tutor_tabla = Table('grupo_tutor', Base.metadata,
    Column('grupo_id', Integer, ForeignKey('grupos.id'), primary_key=True),
    Column('tutor_id', Integer, ForeignKey('usuarios.id'), primary_key=True)
)


class Grupo(Base):
    """
    Modelo de Grupo. Representa una clase o cohorte de estudiantes.
    """
    __tablename__ = "grupos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=func.now())

    # --- Relaciones ---

    # Relación para acceder a la lista de alumnos de este grupo.
    # 'secondary' le dice a SQLAlchemy que use nuestra tabla asociativa.
    # 'back_populates' conecta esta relación con la definida en el modelo Usuario.
    alumnos = relationship(
        "Usuario",
        secondary=grupo_alumno_tabla,
        back_populates="grupos_como_alumno"
    )

    # Relación para acceder a la lista de tutores de este grupo.
    tutores = relationship(
        "Usuario",
        secondary=grupo_tutor_tabla,
        back_populates="grupos_como_tutor"
    )

    # Relación Uno a Muchos: Un grupo puede tener muchas tareas.
    # 'back_populates' conecta con la relación 'grupo' en el modelo Tarea.
    # 'cascade' asegura que si se borra un grupo, sus tareas también se borren.
    tareas = relationship("Tarea", back_populates="grupo", cascade="all, delete-orphan")
