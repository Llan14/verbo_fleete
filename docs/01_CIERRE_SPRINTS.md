# Cierre de Sprints - VerboFlete

Fecha de cierre: 2026-07-24

## Estado ejecutivo

1. Vocabulario completo (FE/BE): Implementado.
2. PDF de reportes: Implementado.
3. SRS adaptativo: Implementado (base funcional SM-2).
4. Gamificacion (streaks/badges): Implementado (MVP funcional).
5. Dark Mode: Implementado global con toggle y overrides.
6. Recharts real en dashboard: Implementado.
7. Cierre documental final: Implementado en carpeta docs.

## Evidencia por entregable

### 1) Vocabulario completo (Frontend + Backend)
- Backend modelo: verboflete_backend/app/models/vocabulary.py
- Backend API: verboflete_backend/app/api/vocabulary.py
- Backend esquemas: verboflete_backend/app/schemas/vocabulary.py
- Frontend pantalla: verboflete_frontend/src/app/(private)/vocabulary/page.tsx
- Ruta alumno: verboflete_frontend/src/app/(private)/alumno/vocabulario/page.tsx
- Menu: verboflete_frontend/src/components/Menu.tsx

Funcionalidades incluidas:
- Generacion de vocabulario por nivel/contexto.
- Guardado de palabras por usuario.
- Listado completo del banco de palabras.
- Filtros por nivel, contexto y busqueda.
- Estadisticas de vocabulario.

### 2) Reportes PDF
- Endpoint: GET /api/sessions/report/pdf
- Archivo: verboflete_backend/app/api/sessions.py
- Boton descarga: verboflete_frontend/src/app/(private)/dashboard/page.tsx

### 3) SRS adaptativo
- Estrategia: SM-2 simplificado.
- Endpoint repaso: POST /api/vocabulary/review
- Logica: verboflete_backend/app/api/vocabulary.py
- Campos SRS persistidos: repeticiones, intervalo_dias, factor_facilidad, proximo_repaso.

### 4) Gamificacion (streaks/badges)
- Endpoint: GET /api/sessions/gamification
- Archivo backend: verboflete_backend/app/api/sessions.py
- Esquema: verboflete_backend/app/schemas/session.py
- Widget frontend: verboflete_frontend/src/app/(private)/dashboard/page.tsx

Incluye:
- Racha actual.
- Mejor racha.
- Insignias por hitos.

### 5) Dark Mode global
- Inicializador global: verboflete_frontend/src/components/ThemeInitializer.tsx
- Toggle global: verboflete_frontend/src/components/ThemeToggleGlobal.tsx
- Variables y overrides: verboflete_frontend/src/app/globals.css
- Montaje global: verboflete_frontend/src/app/layout.tsx

### 6) Dashboard con Recharts
- Dependencia: recharts.
- Graficas de barras y linea en: verboflete_frontend/src/app/(private)/dashboard/page.tsx

## Riesgos y pendientes tecnicos

1. SRS actual es MVP: falta versionado de algoritmo y analitica de retencion.
2. Gamificacion sin tabla de historico de insignias (solo calculo dinamico).
3. PDF actual es minimalista, pendiente plantilla visual avanzada y logos.
4. Falta suite de pruebas automatizadas (unitarias/e2e) para los nuevos modulos.

## Criterios de aceptacion alcanzados

- Se puede generar y guardar vocabulario desde UI.
- Se puede repasar con SRS y observar cambios de intervalo.
- Se puede descargar reporte en PDF desde dashboard.
- Se visualizan graficas en dashboard con Recharts.
- Se puede alternar entre modo claro/oscuro de forma global.
- Se muestran rachas e insignias en dashboard.
