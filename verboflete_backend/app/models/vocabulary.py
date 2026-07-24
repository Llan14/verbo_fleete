from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class VocabularioItem(Base):
    __tablename__ = "vocabulario_items"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)

    termino = Column(String(120), nullable=False)
    traduccion = Column(String(200), nullable=False)
    ejemplo = Column(Text, nullable=True)
    contexto = Column(String(120), nullable=True)
    nivel = Column(String(20), nullable=True)

    repeticiones = Column(Integer, nullable=False, default=0)
    intervalo_dias = Column(Integer, nullable=False, default=1)
    factor_facilidad = Column(Float, nullable=False, default=2.5)

    aciertos = Column(Integer, nullable=False, default=0)
    errores = Column(Integer, nullable=False, default=0)

    proximo_repaso = Column(DateTime(timezone=True), nullable=False, default=func.now(), index=True)
    fecha_creacion = Column(DateTime(timezone=True), nullable=False, default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    usuario = relationship("Usuario")
