# 📜 Proposal: Auth Middleware & Real AI Advisor with Kimi-k2.6

## 1. Alcance Técnico
*   **Módulo de Auth:** Una función middleware de utilidad en `src/lib/auth.ts` que extrae el `tenantId` y el `role` del usuario a partir de las cabeceras HTTP de Next.js, previniendo fugas de contexto.
*   **Real AI Advisor (Kimi Integration):** Construir una clase en `src/lib/ai-advisor.ts` que:
    *   Reciba métricas de campaña (spend, clicks, impressions).
    *   Calcule métricas básicas (CTR, CPC).
    *   Invoque de forma programática a la CLI de `opencode` usando el modelo `opencode/kimi-k2.6` (con la API key del sistema).
    *   Retorne recomendaciones estructuradas en formato JSON directamente del agente de IA.

---

## 2. Escenarios de Comportamiento (Specs Dado/Cuando/Entonces)

### Módulo 1: Auth Middleware
*   **Escenario: Petición sin cabeceras de Tenant.**
    *   **Dado** que un usuario intenta consultar la API de ProM sin enviar la cabecera `x-tenant-id`
    *   **Cuando** la API procesa la solicitud
    *   **Entonces** el middleware debe denegar el acceso y arrojar un error `HTTP 401 Unauthorized`.

### Módulo 2: Real AI Advisor (Kimi-k2.6)
*   **Escenario: Generación Exitosa de Recomendaciones.**
    *   **Dado** un conjunto de métricas de campaña con CTR bajo (ej: Impressions: 10000, Clicks: 20)
    *   **Cuando** el consultor solicita el análisis de optimización de IA
    *   **Entonces** el backend debe llamar a `opencode run` usando el modelo `opencode/kimi-k2.6`, y devolver recomendaciones lógicas estructuradas para mejorar el CTR.
