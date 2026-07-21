from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Tarea(Base):
    """
    Modelo de Tarea. Representa una tarea o asignación dentro de un grupo.
    """
    __tablename__ = "tareas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(String, nullable=True)
    fecha_entrega = Column(DateTime(timezone=True), nullable=False)

    # --- Clave Foránea ---
    grupo_id = Column(Integer, ForeignKey("grupos.id"), nullable=False)

    # --- Relación Inversa ---
    # Permite acceder al objeto Grupo desde una Tarea (ej: tarea.grupo)
    grupo = relationship("Grupo", back_populates="tareas")