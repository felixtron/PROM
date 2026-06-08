/**
 * Emisión y verificación de JSON Web Tokens firmados (HS256) para la sesión de ProM.
 *
 * El secreto se lee EXCLUSIVAMENTE de la variable de entorno JWT_SECRET.
 * Nunca se incrusta en el código ni se devuelve al cliente.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface SessionClaims extends JWTPayload {
  role: string;
  /** tenantId asociado al usuario. Los superusuarios pueden operar de forma global. */
  tenantId?: string;
}

const TOKEN_TTL = '8h';

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // Falla cerrada: sin un secreto fuerte no se emite ni valida ningún token.
    throw new Error(
      'Configuración insegura: JWT_SECRET ausente o demasiado corto (mínimo 32 caracteres).'
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Firma un JWT con los claims de la sesión (rol y tenant).
 */
export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, tenantId: claims.tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .setSubject(claims.tenantId || claims.role)
    .sign(getSecretKey());
}

/**
 * Verifica la firma y vigencia de un JWT y devuelve sus claims.
 * @throws si el token es inválido, fue manipulado o expiró.
 */
export async function verifySessionToken(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
  if (typeof payload.role !== 'string') {
    throw new Error('Token sin rol válido.');
  }
  return payload as SessionClaims;
}
