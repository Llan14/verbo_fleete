import pytest
from httpx import AsyncClient, ASGITransport

# Importa la instancia de FastAPI. Asumiendo que se encuentra en app/main.py
# Si tu archivo principal tiene otro nombre, ajusta esta importación.
from app.main import app 

@pytest.mark.asyncio
async def test_login_credenciales_incorrectas():
    """
    Prueba que el endpoint de login rechace credenciales inválidas.
    """
    # ASGI Transport simula el servidor para que no tengas que levantar uno real
    transport = ASGITransport(app=app)
    
    # Usamos httpx.AsyncClient para hacer la petición HTTP a FastAPI
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/auth/login",
            data={"username": "usuario_falso@email.com", "password": "password_incorrecto"}
        )
        
    # Verificamos que el código de estado y el mensaje sean los esperados
    assert response.status_code == 401
    datos_respuesta = response.json()
    assert datos_respuesta["detail"] == "Correo o contraseña incorrectos"
