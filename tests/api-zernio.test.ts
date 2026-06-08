import { describe, it, expect } from 'vitest';
import { POST } from '../src/app/api/zernio/route';
import { bearer } from './setup';

describe('API Route: POST /api/zernio', () => {
  it('debe bloquear la petición sin token Bearer (401)', async () => {
    const request = new Request('http://localhost/api/zernio', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1111-owner', content: 'Test', platforms: ['telegram'] }),
      headers: {},
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('autorizado');
  });

  it('debe publicar si el token es válido y la campaña pertenece al tenant', async () => {
    const request = new Request('http://localhost/api/zernio', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: 'camp-1111-owner',
        content: 'Hola desde Next.js API',
        platforms: ['telegram'],
      }),
      headers: {
        authorization: await bearer('superuser'),
        'x-tenant-id': 'tenant-1-alpha',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.zernio_post_id).toBeDefined();
  });

  it('debe bloquear (403) la publicación en una campaña de OTRO tenant (anti-IDOR)', async () => {
    const request = new Request('http://localhost/api/zernio', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: 'camp-2222-other', // pertenece a tenant-2-beta
        content: 'Intento de acceso cruzado',
        platforms: ['telegram'],
      }),
      headers: {
        // superuser apuntando explícitamente a tenant-1-alpha
        authorization: await bearer('superuser'),
        'x-tenant-id': 'tenant-1-alpha',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
