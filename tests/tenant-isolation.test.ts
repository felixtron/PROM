import { describe, it, expect } from 'vitest';
import { getCampaignById } from '../src/lib/db';

describe('Módulo 1: Aislamiento de Datos Multi-tenant', () => {
  it('debe permitir la lectura si el usuario pertenece al tenant propietario de la campaña', async () => {
    // Escenario: Campaña pertenece a Tenant 1 y el usuario es del Tenant 1
    const campaignId = 'camp-1111-owner';
    const userTenantId = 'tenant-1-alpha';

    const campaign = await getCampaignById(campaignId, userTenantId);
    expect(campaign).toBeDefined();
    expect(campaign.tenantId).toBe(userTenantId);
    expect(campaign.title).toBe('Campaña de Meta Ads para Cliente Alpha');
  });

  it('debe arrojar una excepción 403 / Forbidden si el tenant del usuario no coincide con el de la campaña', async () => {
    // Escenario: Campaña pertenece a Tenant 2 y el usuario malicioso es del Tenant 1
    const campaignId = 'camp-2222-other';
    const attackerTenantId = 'tenant-1-alpha';

    await expect(
      getCampaignById(campaignId, attackerTenantId)
    ).rejects.toThrow('HTTP 403 Forbidden: Acceso no autorizado a este Tenant.');
  });
});
