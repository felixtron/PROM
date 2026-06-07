import { describe, it, expect } from 'vitest';
import { POST } from '../src/app/api/zernio/route';

describe('API Route: POST /api/zernio', () => {
  it('debe bloquear la petición si faltan las cabeceras de tenant y rol', async () => {
    const request = new Request('http://localhost/api/zernio', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1111-owner', content: 'Test', platforms: ['telegram'] }),
      headers: {}
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('debe permitir publicar si las cabeceras y payload son válidos', async () => {
    const request = new Request('http://localhost/api/zernio', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: 'camp-1111-owner',
        content: 'Hola desde Next.js API',
        platforms: ['telegram']
      }),
      headers: {
        'x-tenant-id': 'tenant-1-alpha',
        'x-user-role': 'production'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.zernio_post_id).toBeDefined();
  });
});
