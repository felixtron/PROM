import { describe, it, expect } from 'vitest';
import { POST } from '../src/app/api/ai-advisor/route';
import { bearer } from './setup';

describe('API Route: POST /api/ai-advisor', () => {
  it('debe rechazar la petición sin token Bearer válido (401)', async () => {
    const request = new Request('http://localhost/api/ai-advisor', {
      method: 'POST',
      body: JSON.stringify({ metrics: { impressions: 1, clicks: 1, spend: 1 } }),
      headers: { 'x-tenant-id': 'tenant-1-alpha', 'x-user-role': 'superuser' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('debe procesar el payload de métricas con un token válido', async () => {
    const request = new Request('http://localhost/api/ai-advisor', {
      method: 'POST',
      body: JSON.stringify({
        metrics: { impressions: 12000, clicks: 30, spend: 60.0 },
      }),
      headers: {
        authorization: await bearer(),
        'x-tenant-id': 'tenant-1-alpha',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.ctr).toBe('0.25%');
    expect(body.recommendations.length).toBeGreaterThan(0);
  });
});
