// Base de datos en memoria para mockear el comportamiento del MVP de ProM
const mockCampaignsDatabase: Record<string, { id: string; tenantId: string; title: string }> = {
  'camp-1111-owner': {
    id: 'camp-1111-owner',
    tenantId: 'tenant-1-alpha',
    title: 'Campaña de Meta Ads para Cliente Alpha'
  },
  'camp-2222-other': {
    id: 'camp-2222-other',
    tenantId: 'tenant-2-beta',
    title: 'Campaña de Google Ads para Cliente Beta'
  }
};

/**
 * Obtiene una campaña por su ID forzando de forma estricta el aislamiento multi-tenant.
 * @param id ID de la campaña a consultar
 * @param userTenantId ID del tenant asociado al usuario actual que realiza la consulta
 * @throws {Error} HTTP 403 Forbidden si el tenant no coincide
 */
export async function getCampaignById(id: string, userTenantId: string) {
  const campaign = mockCampaignsDatabase[id];
  
  if (!campaign) {
    throw new Error('HTTP 404 Not Found: Campaña no encontrada.');
  }

  // REGLA CRÍTICA DE AISLAMIENTO MULTI-TENANT:
  // Si el tenant_id de la campaña no coincide con el tenant_id de la sesión del usuario,
  // bloqueamos el acceso inmediatamente.
  if (campaign.tenantId !== userTenantId) {
    throw new Error('HTTP 403 Forbidden: Acceso no autorizado a este Tenant.');
  }

  return campaign;
}
