# Este archivo __init__.py convierte la carpeta 'models' en un paquete de Python.
# Su propósito principal aquí es importar todos los modelos de datos de SQLAlchemy
# en un solo lugar.

# Al hacer esto, nos aseguramos de que SQLAlchemy "conozca" todos los modelos
# y pueda construir correctamente las relaciones entre ellos (como la de Grupo -> Tarea)
# cuando se inicia la aplicación, evitando errores de "modelo no encontrado".

from .user import Usuario
from .group import Grupo
from .task import Tarea