import { describe, it, expect } from 'vitest';
import { POST } from '../src/app/api/auth/login/route';

describe('API Route: POST /api/auth/login', () => {
  it('debe rechazar credenciales incorrectas con HTTP 401', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'consultant@prosuite.mx',
        password: 'password-equivocado'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Credenciales inválidas');
  });

  it('debe aceptar credenciales de superusuario válidas con HTTP 200', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'consultant@prosuite.mx',
        password: '***MOVIDO-A-ENV***'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.role).toBe('superuser');
    expect(body.token).toBeDefined();
  });
});
