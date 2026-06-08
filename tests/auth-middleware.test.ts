import { describe, it, expect, beforeAll } from 'vitest';
import { verifySession } from '../src/lib/auth';
import { signSession } from '../src/lib/jwt';

// Secreto de prueba (>=32 chars) para firmar/verificar tokens en el test.
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-of-at-least-32-characters-long!!';
});

describe('Módulo: Auth basada en JWT & Aislamiento de Tenant', () => {
  it('rechaza la petición si no hay token Bearer (cabeceras falsificables ya no bastan)', async () => {
    // Antes bastaba con enviar x-tenant-id/x-user-role: ahora es 401.
    await expect(
      verifySession({ 'x-tenant-id': 'tenant-2-beta', 'x-user-role': 'superuser' })
    ).rejects.toThrow('HTTP 401 Unauthorized');
  });

  it('rechaza un token manipulado / inválido', async () => {
    await expect(
      verifySession({ authorization: 'Bearer not.a.valid.token' })
    ).rejects.toThrow('HTTP 401 Unauthorized');
  });

  it('permite a un superuser seleccionar el tenant vía cabecera con token válido', async () => {
    const token = await signSession({ role: 'superuser', tenantId: 'global-superuser' });
    const session = await verifySession({
      authorization: `Bearer ${token}`,
      'x-tenant-id': 'tenant-1-alpha',
    });
    expect(session.role).toBe('superuser');
    expect(session.tenantId).toBe('tenant-1-alpha');
  });

  it('ancla a un usuario no-superuser a su tenant firmado, ignorando la cabecera falsificada', async () => {
    const token = await signSession({ role: 'editor', tenantId: 'tenant-1-alpha' });
    const session = await verifySession({
      authorization: `Bearer ${token}`,
      // Intento de acceso cruzado: debe ser ignorado.
      'x-tenant-id': 'tenant-2-beta',
    });
    expect(session.role).toBe('editor');
    expect(session.tenantId).toBe('tenant-1-alpha');
  });
});
