/**
 * Validador de cabeceras HTTP para autenticación y aislamiento multi-tenant.
 */
export interface UserSession {
  tenantId: string;
  role: string;
}

/**
 * Valida que existan las cabeceras requeridas de sesión y las extrae de forma segura.
 * @param headers Objeto que contiene las cabeceras de la petición HTTP
 * @throws {Error} HTTP 401 Unauthorized si falta alguna cabecera crítica
 */
export function validateAuthHeaders(headers: Record<string, string | string[] | undefined>): UserSession {
  const tenantId = headers['x-tenant-id'];
  const role = headers['x-user-role'];

  if (!tenantId) {
    throw new Error('HTTP 401 Unauthorized: Cabecera x-tenant-id ausente.');
  }

  if (!role) {
    throw new Error('HTTP 401 Unauthorized: Cabecera x-user-role ausente.');
  }

  return {
    tenantId: Array.isArray(tenantId) ? tenantId[0] : tenantId,
    role: Array.isArray(role) ? role[0] : role
  };
}
