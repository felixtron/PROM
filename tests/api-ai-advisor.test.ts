import { describe, it, expect } from 'vitest';
import { POST } from '../src/app/api/ai-advisor/route';

describe('API Route: POST /api/ai-advisor', () => {
  it('debe procesar el payload de métricas correctamente y llamar al Kimi Advisor', async () => {
    const request = new Request('http://localhost/api/ai-advisor', {
      method: 'POST',
      body: JSON.stringify({
        metrics: {
          impressions: 12000,
          clicks: 30,
          spend: 60.00
        }
      }),
      headers: {
        'x-tenant-id': 'tenant-1-alpha',
        'x-user-role': 'superuser'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.ctr).toBe('0.25%');
    expect(body.recommendations.length).toBeGreaterThan(0);
  });
});
