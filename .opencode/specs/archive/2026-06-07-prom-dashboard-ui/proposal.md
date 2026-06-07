# 📜 Proposal: ProM (Pro Marketing) — MVP Core Implementation

## 1. Problema e Intención
ProSuite necesita unificar el marketing de sus clientes bajo una sola consola operada internamente por sus consultores. Actualmente, el flujo de desarrollo de campañas, validación del cliente y publicación en múltiples canales está fragmentado, lo que incrementa el tiempo de salida al mercado (Time-to-market) y eleva los costos operativos. 
**ProM** soluciona esto proveyendo una arquitectura de software multi-tenant donde los consultores gestionan, los clientes validan, la producción ejecuta y un agente de IA optimiza el rendimiento.

---

## 2. Alcance del MVP (In-Scope vs. Out-of-Scope)

### 🟢 In-Scope (Dentro de alcance para la v1)
1.  **Multi-tenant Logic:** Estructura de base de datos para almacenar múltiples empresas (Tenants) y usuarios asociados con roles rígidos: `Superuser`, `Tenant Admin`, `Client Validator`, `Production`.
2.  **Dashboard de Contenidos:** Panel unificado donde se visualizan:
    *   Borradores de ideas (creados por el agente del cliente).
    *   Campañas en producción.
    *   Contenidos pendientes de validación por la empresa.
3.  **Integración Zernio:** Un módulo backend conectado a la API de Zernio para lanzar posteos orgánicos a las redes asociadas del tenant.
4.  **Módulo de Marketing Pagado (Google & Meta Ads Mockup/Integración inicial):** Dashboard básico de lectura que consolide clicks, impresiones, CTR e inversión de Google Ads y Meta Ads.
5.  **Agente AI Integrador:** Un prompt de sistema asíncrono que analice un dataset JSON de las campañas de Google/Meta del día anterior y emita recomendaciones del tipo: "Reducir presupuesto en adset X debido a CTR bajo, mover a adset Y".

### 🔴 Out-of-Scope (Fuera de alcance para la v1)
*   Pasarelas de pago internas (el consultor de ProSuite gestiona el cobro por fuera).
*   Herramienta de diseño gráfico interactiva de arrastrar y soltar (se usarán templates predefinidos estáticos renderizados con Tailwind/HTML).
*   Sincronización de audiencias personalizadas de Meta en tiempo real.

---

## 3. Plan de Estructura de Archivos (Propuesta)
El proyecto se creará bajo la estructura estándar de Next.js:
```
prom/
├── src/
│   ├── app/                      # Next.js App Router (Páginas y APIs)
│   │   ├── api/
│   │   │   ├── auth/             # Autenticación multi-tenant
│   │   │   ├── zernio/           # Enlace a Zernio SDK
│   │   │   └── ai-advisor/       # Agente analista
│   │   └── dashboard/            # Panel unificado (Views por rol)
│   ├── components/               # UI Reutilizable (Tailwind CSS)
│   ├── lib/
│   │   ├── db.ts                 # Conector PostgreSQL con tenant_id manual/ORM
│   │   └── zernio-client.ts      # Instanciación segura del SDK de Zernio
│   └── types/                    # Tipos de TypeScript (Tenants, Users, Campaigns)
├── docs/                         # Históricos y documentación
└── tests/                        # Suite de pruebas (TDD)
```

---

## 4. Métricas de Éxito y Plan de Rollback
*   **Métricas de Éxito:**
    *   Aislamiento de Tenant del 100% (cero fugas de información entre IDs).
    *   Posteo exitoso a Zernio API verificado con mocks locales en tests.
    *   Tiempo de carga de la página del Dashboard inferior a 1.2s en conexiones normales (auditoría de waterfalls).
*   **Plan de Rollback:**
    *   Control de versiones estricto con Git.
    *   Base de datos PostgreSQL con migraciones versionadas (Knex o Prisma) para revertir cambios de esquema instantáneamente si falla el despliegue.
