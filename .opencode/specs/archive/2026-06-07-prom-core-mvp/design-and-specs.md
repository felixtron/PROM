# 🗺️ Specifications & Design: ProM (Pro Marketing) Core Modules

Este documento define formalmente el comportamiento de la solución mediante escenarios **Dado/Cuando/Entonces** (specs de comportamiento) y especifica las firmas técnicas de las APIs del MVP.

---

## 1. Escenarios de Comportamiento (Specs)

### Módulo 1: Aislamiento de Datos Multi-tenant
*   **Escenario 1: Bloqueo de acceso cruzado entre Tenants.**
    *   **Dado** que el usuario de producción "Marcos" pertenece al Tenant `A` (Cliente A)
    *   **Cuando** Marcos intenta leer las métricas o campañas que pertenecen al Tenant `B`
    *   **Entonces** la API del sistema debe rechazar la consulta y devolver un código de error `HTTP 403 Forbidden`.

### Módulo 2: Flujo de Aprobación de Campañas (Consultor ➡️ Cliente ➡️ Producción)
*   **Escenario 1: Creación y Validación Exitosa.**
    *   **Dado** que el Consultor de ProSuite ha diseñado un borrador de campaña de Meta Ads para el Tenant `A`
    *   **Cuando** el Validador del Cliente (Client Validator) inicia sesión, revisa la propuesta y hace clic en "Aprobar"
    *   **Entonces** el estado de la campaña cambia de `Borrador` a `Validada`, habilitando al equipo de producción para desarrollarla e integrarla con las APIs externas.

### Módulo 3: Publicación Orgánica vía Zernio API
*   **Escenario 1: Envío Exitoso Multicanal.**
    *   **Dado** que existe una publicación en estado `Aprobada` con los canales `[Twitter, Telegram]` seleccionados
    *   **Cuando** el equipo de producción presiona "Publicar en Redes"
    *   **Entonces** el sistema debe instanciar el SDK de Zernio, enviar el payload estructurado a `https://zernio.com/api/v1/posts` y registrar el ID de post devuelto por Zernio.

---

## 2. Diseño Técnico de Firmas de API y Esquemas de Base de Datos

### A. Esquema Relacional de Base de Datos (Mínimo MVP)
```sql
-- Tabla de Tenants (Clientes de ProSuite)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'superuser', 'tenant_admin', 'validator', 'production'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Campañas
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    channels JSONB NOT NULL, -- ['meta', 'google', 'zernio']
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'published', 'archived'
    budget DECIMAL(10, 2) DEFAULT 0.00,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### B. Firmas de API (Endpoints en Next.js)

#### 1. Endpoint de Publicación Orgánica: `POST /api/zernio/publish`
*   **Cabeceras:** `Authorization: Bearer <token_session>`
*   **Cuerpo del Request:**
    ```json
    {
      "campaign_id": "893c528f-7c18-4fbb-a722-e4d6a1b2c3d4",
      "platforms": ["telegram", "twitter"],
      "content": "¡ProSuite lanza un nuevo producto hoy! Visita https://prosuite.mx"
    }
    ```
*   **Respuesta Exitosa (HTTP 200 OK):**
    ```json
    {
      "success": true,
      "zernio_post_id": "zn_9012351234",
      "published_at": "2026-06-07T04:45:00Z"
    }
    ```

#### 2. Endpoint de Análisis del Advisor IA: `POST /api/ai-advisor/analyze`
*   **Cabeceras:** `Authorization: Bearer <token_session>`
*   **Cuerpo del Request (Métricas de campaña):**
    ```json
    {
      "tenant_id": "893c528f-7c18-4fbb-a722-e4d6a1b2c3d4",
      "campaign_id": "bc1234-...",
      "metrics": {
        "impressions": 15000,
        "clicks": 120,
        "spend": 45.50
      }
    }
    ```
*   **Respuesta de Kimi (HTTP 200 OK):**
    ```json
    {
      "success": true,
      "analysis": {
        "ctr": "0.8%",
        "status": "warning",
        "recommendations": [
          "El CTR es inferior al 1.2% promedio. Se recomienda actualizar el copy de Meta con un llamado a la acción más directo.",
          "El costo por click es alto. Se sugiere ajustar la audiencia en Meta Ads reduciendo el segmento de edad de 25-45 a 30-40."
        ]
      }
    }
    ```
