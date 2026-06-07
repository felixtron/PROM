# 📋 Briefing Técnico: ProM (Pro Marketing) — ProSuite Internal Tool

## 1. Introducción y Propósito
**ProM (Pro Marketing)** es una herramienta interna de ProSuite diseñada para centralizar, automatizar y auditar la creación de contenidos de marketing multicanal (pauta en Meta/Google Ads y redes sociales). 
El sistema no será operado por el cliente final, sino por un **Consultor de ProSuite**, quien actuará como el ejecutor técnico. El cliente únicamente intervendrá para proponer conceptos (a través de un mini-agente integrado) y validar los entregables finales.

---

## 2. Decisiones de Arquitectura Principal

### A. Multi-tenant con Aislamiento Estricto (Superuser & Tenants)
*   **Estructura:** Base de datos compartida con aislamiento a nivel lógico mediante un identificador de tenant (`tenant_id`) indexado de manera obligatoria en todas las consultas.
*   **Roles y Permisos (RBAC):**
    1.  `Superuser (Consultor ProSuite)`: Acceso total a todos los tenants, configuraciones de API globales y monitorización de campañas.
    2.  `Tenant Admin (Cliente Principal)`: Capacidad para invitar usuarios de su propia empresa para validar contenidos.
    3.  `Client Validator (Validador)`: Solo lectura de propuestas creadas por producción, con capacidad para dar feedback o aprobar/rechazar (Pass/Block).
    4.  `Production Team (Creadores)`: Encargados de redactar textos, asociar creativos e integrar con templates de diseño una vez aprobada la propuesta.

### B. Flujo de Trabajo Desacoplado (El Pipeline ProM)
```
[Cliente / AI Agent] ➡️ Propuesta/Idea inicial (Borrador)
      ⬇️
[Consultor ProSuite] ➡️ Maquetación y Diseño de Campaña
      ⬇️
[Client Validator]  ➡️ Validación y Feedback (Aprobado/Rechazado)
      ⬇️
[Production Team]   ➡️ Desarrollo de contenidos y publicación vía APIs
```

### C. Integración de Canales y APIs
1.  **Redes Orgánicas (14+ plataformas):** Integración directa con **Zernio API** (`https://zernio.com/api/v1`) utilizando el SDK de Node.js oficial (`@zernio/chat-sdk-adapter`).
2.  **Pauta Pagada (Google Ads & Meta Ads):**
    *   Integración con la API de Google Ads para monitorear presupuestos y campañas de búsqueda/display.
    *   Integración con Meta Graph API (Marketing API) para la visualización del dashboard unificado.
3.  **Módulo de Inteligencia Artificial (ProM AI Agent):**
    *   Un agente analista asíncrono (usando Kimi o GPT-5-Codex en background) que lea las métricas de conversión diariamente y proponga recomendaciones estructuradas para mejorar el ROI.

---

## 3. Trade-offs y Mitigación de Riesgos

*   **Riesgo 1: Complejidad Multi-tenant en pauta de terceros.** Las credenciales de Meta y Google Ads pertenecen a cada cliente individualmente.
    *   *Mitigación:* Implementar un esquema cifrado en base de datos para almacenar los tokens de acceso de OAuth por cada Tenant de forma aislada, utilizando llaves KMS de producción.
*   **Riesgo 2: Consistencia en Renderizado de Templates.**
    *   *Mitigación:* Integrar templates HTML prediseñados y validados con Tailwind CSS y componentes serializables para garantizar consistencia visual antes de exportar.

---

## 4. Estándar de Despliegue (Directiva ProSuite)
*   El backend y frontend se empaquetarán en una imagen Docker multi-stage optimizada.
*   Se desplegará en la red interna de Traefik del VPS default (`panel-prosuite-2`), aislado por cliente en `/opt/stacks/prom/`.
