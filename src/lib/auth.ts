/**
 * Autenticación y aislamiento multi-tenant basado en JWT firmado.
 *
 * A diferencia de la versión anterior (que confiaba ciegamente en cabeceras
 * `x-tenant-id` / `x-user-role` falsificables por cualquier cliente), aquí el rol
 * y el tenant se derivan de un token Bearer firmado por el servidor.
 */
import { verifySessionToken } from './jwt';

export interface UserSession {
  tenantId: string;
  role: string;
}

const SUPERUSER_ROLE = 'superuser';

export class AuthError extends Error {
  constructor(message: string) {
    super(`HTTP 401 Unauthorized: ${message}`);
    this.name = 'AuthError';
  }
}

function extractBearer(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers['authorization'] ?? headers['Authorization'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith('Bearer ')) {
    throw new AuthError('Cabecera Authorization Bearer ausente o malformada.');
  }
  return value.slice('Bearer '.length).trim();
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Verifica el JWT de la petición y resuelve el tenant efectivo de forma segura.
 *
 * - El `role` SIEMPRE proviene del token (no de cabeceras).
 * - Un `superuser` puede seleccionar el tenant sobre el que opera mediante la
 *   cabecera `x-tenant-id` (consola de consultor multi-cliente).
 * - Cualquier otro rol queda anclado al `tenantId` firmado en su token; no puede
 *   acceder a datos de otro tenant aunque envíe la cabecera.
 *
 * @throws {AuthError} HTTP 401 si el token falta, está manipulado o expiró.
 */
export async function verifySession(
  headers: Record<string, string | string[] | undefined>
): Promise<UserSession> {
  const token = extractBearer(headers);

  let claims;
  try {
    claims = await verifySessionToken(token);
  } catch {
    throw new AuthError('Token inválido o expirado.');
  }

  const role = claims.role;

  if (role === SUPERUSER_ROLE) {
    const requested = single(headers['x-tenant-id']);
    return { role, tenantId: requested || claims.tenantId || 'global-superuser' };
  }

  if (!claims.tenantId) {
    throw new AuthError('El token no contiene un tenant asociado.');
  }
  return { role, tenantId: claims.tenantId };
}
