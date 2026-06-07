# ADR-001: Arquitectura Base de la Plataforma ProM (Pro Marketing)

*   **Fecha:** 2026-06-07
*   **Estado:** Aceptado (Visto bueno del usuario principal Felix G)
*   **Autor:** Probot (Ingeniero de Software Principal)

---

## 1. Contexto y Problema
ProSuite necesita desarrollar una herramienta interna ("ProM") para que sus consultores administren, diseñen, validen y publiquen de forma automatizada campañas publicitarias (Google & Meta Ads) y de contenido orgánico (Zernio API) de múltiples clientes bajo un esquema de superusuario multi-tenant.

Se requiere alta velocidad de desarrollo, aislamiento garantizado de datos entre tenants (empresas de clientes), facilidad de pruebas en aislamiento (TDD) y un costo bajo de infraestructura en producción.

---

## 2. Decisiones Tecnológicas Clave

### A. Next.js 15 con App Router y TypeScript
*   **Por qué:** Next.js provee una arquitectura híbrida unificada (Server y Client Components) idónea para construir un dashboard dinámico y robusto. Nos permite escribir APIs backend (`/api/*`) y vistas frontend (`/dashboard/*`) en el mismo repositorio, acelerando la validación del MVP y facilitando la modularización.

### B. PostgreSQL con Aislamiento Lógico (Tenant ID)
*   **Por qué:** Un modelo de base de datos compartida (Shared Database, Shared Schema) es el enfoque más ágil y económico para el MVP.
*   **Garantía de aislamiento:** Se implementará un helper de persistencia que añade la condición `WHERE tenant_id = ?` a todas las consultas de lectura/escritura de manera forzada y centralizada.

### C. Integración Nativa con el SDK oficial de Zernio
*   **Por qué:** Zernio es el motor elegido para publicar contenido orgánico multicanal (14+ redes). La comunicación se encapsulará en una librería cliente interna (`lib/zernio-client.ts`) que consumirá la variable `OPENCODE_API_KEY` o un token de tenant específico de forma segura.

### D. Agente de IA para Optimización Continua
*   **Por qué:** Kimi (kimi-k2.6) se utilizará en el backend de forma asíncrona mediante un pipeline de prompts estructurados que reciben JSON de métricas y devuelven JSON con propuestas accionables.

---

## 3. Consecuencias y Trade-offs
*   **Ventajas:**
    *   Implementación rápida del MVP en un solo repositorio.
    *   Costo de infraestructura mínimo (desplegables en contenedores Docker de un único servidor `panel-prosuite-2`).
    *   Alineado 100% con la Directiva de Deployments de ProSuite.
*   **Desventajas / Desafíos:**
    *   El aislamiento lógico requiere estricta disciplina en el código para no olvidar las cláusulas `tenant_id` (se mitigará mediante tests automatizados en nuestra Fase de Apply con TDD).
