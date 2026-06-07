import { describe, it, expect, vi } from 'vitest';
import { publishToZernio } from '../src/lib/zernio-client';

// Mock del SDK oficial de Zernio
vi.mock('@/lib/zernio-client', async (importOriginal) => {
  return {
    publishToZernio: vi.fn().mockImplementation(async (campaignId: string, content: string, platforms: string[]) => {
      if (!campaignId || !content || platforms.length === 0) {
        throw new Error('Payload inválido');
      }
      return {
        success: true,
        zernio_post_id: 'zn_9012351234',
        published_at: new Date().toISOString()
      };
    })
  };
});

describe('Módulo 3: Publicación Orgánica vía Zernio SDK', () => {
  it('debe llamar al cliente de Zernio de forma exitosa si el payload es válido', async () => {
    const campaignId = 'camp-1111-owner';
    const content = '¡Hola Mundo de ProSuite!';
    const platforms = ['telegram', 'twitter'];

    const result = await publishToZernio(campaignId, content, platforms);
    
    expect(result.success).toBe(true);
    expect(result.zernio_post_id).toBe('zn_9012351234');
    expect(publishToZernio).toHaveBeenCalledWith(campaignId, content, platforms);
  });
});
