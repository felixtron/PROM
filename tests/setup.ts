/**
 * Setup global de pruebas: inyecta variables de entorno de seguridad para que
 * la firma/verificación de JWT y el login funcionen de forma determinista.
 */
process.env.JWT_SECRET = 'test-secret-of-at-least-32-characters-long!!';
process.env.ADMIN_EMAIL = 'consultant@prosuite.mx';
process.env.ADMIN_PASSWORD = 'test-admin-password';

/** Helper compartido: emite un Bearer token de superusuario para las pruebas de rutas. */
export async function bearer(role = 'superuser', tenantId = 'global-superuser'): Promise<string> {
  const { signSession } = await import('../src/lib/jwt');
  return `Bearer ${await signSession({ role, tenantId })}`;
}
