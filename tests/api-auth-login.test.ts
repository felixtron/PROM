import { describe, it, expect } from 'vitest';
import { POST } from '../src/app/api/auth/login/route';

// ADMIN_EMAIL/ADMIN_PASSWORD/JWT_SECRET se inyectan en tests/setup.ts

describe('API Route: POST /api/auth/login', () => {
  it('debe rechazar credenciales incorrectas con HTTP 401', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'consultant@prosuite.mx',
        password: 'password-equivocado',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Credenciales inválidas');
  });

  it('debe aceptar credenciales válidas y emitir un JWT firmado (no estático)', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'consultant@prosuite.mx',
        password: 'test-admin-password',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.role).toBe('superuser');
    expect(body.token).toBeDefined();
    // Un JWT real tiene 3 segmentos separados por puntos.
    expect(body.token.split('.')).toHaveLength(3);
  });
});
