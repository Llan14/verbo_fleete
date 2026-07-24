# Guia Tecnica Final - VerboFlete

## 1. Arquitectura general

- Frontend: Next.js App Router + React + Tailwind.
- Backend: FastAPI + SQLAlchemy.
- Base de datos: SQLite en entorno local.
- Autenticacion: JWT por token en cliente.

## 2. Modulos principales

### Aprendizaje
- Reading, Listening, Speaking, Writing, Grammar.
- Vocabulario con repaso SRS.

### Analitica
- Dashboard de desempeno por tiempos verbales.
- Recomendaciones y debilidades.
- Reporte PDF descargable.

### Motivacion
- Rachas de actividad.
- Insignias por hitos.

## 3. Endpoints nuevos/relevantes

### Vocabulario
- POST /api/vocabulary/generate
- POST /api/vocabulary/save
- GET /api/vocabulary/my
- GET /api/vocabulary/due
- GET /api/vocabulary/stats
- POST /api/vocabulary/review

### Reportes y gamificacion
- GET /api/sessions/report/pdf
- GET /api/sessions/gamification

## 4. Modelo de datos agregado

Tabla vocabulario_items:
- id
- usuario_id
- termino
- traduccion
- ejemplo
- contexto
- nivel
- repeticiones
- intervalo_dias
- factor_facilidad
- aciertos
- errores
- proximo_repaso
- fecha_creacion
- fecha_actualizacion

## 5. Regla SRS implementada (SM-2 simplificado)

- Calidad < 3:
  - repeticiones = 0
  - intervalo_dias = 1
- Calidad >= 3:
  - incremento de repeticiones
  - intervalo recalculado por factor de facilidad
- factor_facilidad minimo = 1.3
- proximo_repaso = ahora + intervalo_dias

## 6. Dark mode global

Mecanismo:
- Persistencia por localStorage (verboflete-theme).
- Atributo global data-theme en html.
- Clase dark sincronizada en html.
- Overwrites para utilidades frecuentes de Tailwind (bg/text/border/hover/ring).

## 7. Build y ejecucion local

Frontend:
1. cd verboflete_frontend
2. npm install
3. npm run dev

Backend:
1. cd verboflete_backend
2. pip install -r requirements.txt
3. uvicorn app.main:app --reload

## 8. Checklist de validacion final

- Login funcional.
- Dashboard muestra graficas.
- Boton PDF descarga archivo valido.
- Vocabulario permite generar, guardar y filtrar.
- SRS mueve tarjetas a nuevas fechas.
- Gamificacion muestra racha e insignias.
- Toggle global cambia tema en toda la app.

## 9. Recomendaciones post-cierre

1. Agregar migraciones alembic para nuevos modelos de forma controlada.
2. Incorporar pruebas unitarias para SRS y gamificacion.
3. Crear pruebas e2e para flujo completo de vocabulario.
4. Homologar paleta semantica de estados en todos los modulos.
5. Crear version visual premium del PDF (branding, tablas, firma docente).
