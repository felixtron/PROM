import { describe, it, expect, vi } from 'vitest';
import { analyzeCampaignMetrics } from '../src/lib/ai-advisor';

describe('Módulo: AI Advisor (Kimi-k2.6 Real Integration)', () => {
  it('debe procesar métricas de campaña y retornar un análisis estructurado de IA', async () => {
    const metrics = {
      impressions: 10000,
      clicks: 25, // CTR = 0.25% (muy bajo, requiere acción de Kimi)
      spend: 50.00
    };

    const analysis = await analyzeCampaignMetrics(metrics, 'tenant-1-alpha');
    
    expect(analysis).toBeDefined();
    expect(analysis.success).toBe(true);
    expect(analysis.ctr).toBe('0.25%');
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    // Verificar que Kimi detectó el bajo rendimiento y ofreció recomendaciones
    expect(analysis.recommendations[0]).toContain('CTR');
  }, 90000); // 90 segundos de timeout ya que hace la llamada real a opencode/Kimi
});
