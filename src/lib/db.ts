import * as fs from 'fs';
import * as path from 'path';

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

export interface CampaignBrief {
  objective: string;
  audience: string;
  budget: number;
  kpis: string;
}

export interface TenantContext {
  id: string;
  name: string;
  brandIdentity: string;
  toneOfVoice: string;
  brandBookText?: string;
  activeBrief?: CampaignBrief;
}

// Valores iniciales de Tenants para no arrancar vacíos
const defaultTenants: Record<string, TenantContext> = {
  'tenant-1-alpha': {
    id: 'tenant-1-alpha',
    name: 'Cliente Alpha (ProSuite BPM & Cloud)',
    brandIdentity: 'Software de automatización de procesos de negocio (BPM) y gestión de infraestructura cloud en un modelo SaaS para medianas y grandes empresas en Latinoamérica.',
    toneOfVoice: 'Professional',
    brandBookText: 'Paleta de colores: Índigo #4F46E5, Gris pizarra #1E293B. Logo en formato horizontal siempre en fondos oscuros. Tipografía sans-serif limpia. Prohibido usar expresiones informales o promesas de cero costo. Enfatizar el ahorro de tiempo operativo de hasta un 40%.',
    activeBrief: {
      objective: 'Captación de Leads calificados para demostración comercial (Demo Booking).',
      audience: 'Directores de Operaciones, COOs, y Directores de TI/Sistemas de empresas de más de 100 empleados en México y Colombia.',
      budget: 1500,
      kpis: 'Costo por Lead (CPL) menor a $20 USD. Registro de 75 demos completadas al mes.'
    }
  },
  'tenant-2-beta': {
    id: 'tenant-2-beta',
    name: 'Cliente Beta (Finanzas Corporativas)',
    brandIdentity: 'Consultora boutique de planeación financiera estratégica, fusiones y adquisiciones (M&A) y estructuración de deuda corporativa.',
    toneOfVoice: 'Technical',
    brandBookText: 'Paleta de colores: Azul Marino #0F172A, Dorado #D97706. Tipografía Serif elegante. Tono sumamente formal, analítico y preciso. Queda prohibido usar exclamaciones en copies o promesas de retornos garantizados. Todo argumento debe sustentarse en datos o regulaciones de la CNBV.',
    activeBrief: {
      objective: 'Generación de prospectos (MQLs) calificados para consultoría de reestructuración financiera.',
      audience: 'CFOs, Directores de Finanzas, Socios y Accionistas de medianas empresas industriales facturando más de 50M MXN anuales.',
      budget: 2500,
      kpis: 'Costo por click (CPC) de Google Search menor a $2.5 USD. Tasa de conversión de landing mayor al 3.5%.'
    }
  }
};

const DB_FILE_PATH = path.join(process.cwd(), 'prom-db.json');

function readDb(): Record<string, TenantContext> {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error leyendo base de datos de Tenants:', e);
  }
  return defaultTenants;
}

function writeDb(data: Record<string, TenantContext>) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error escribiendo base de datos de Tenants:', e);
  }
}

/**
 * Obtiene la configuración y contexto de marca del tenant de forma persistente.
 */
export async function getTenantContext(tenantId: string): Promise<TenantContext> {
  const db = readDb();
  const context = db[tenantId];
  if (!context) {
    // Si no existe, creamos uno básico por defecto
    return {
      id: tenantId,
      name: tenantId === 'tenant-1-alpha' ? 'Cliente Alpha' : tenantId === 'tenant-2-beta' ? 'Cliente Beta' : `Cliente ${tenantId}`,
      brandIdentity: '',
      toneOfVoice: 'Professional',
      brandBookText: ''
    };
  }
  return context;
}

/**
 * Guarda o actualiza la configuración de marca/brief del tenant de forma persistente.
 */
export async function updateTenantContext(tenantId: string, contextUpdate: Partial<TenantContext>): Promise<TenantContext> {
  const db = readDb();
  const current = db[tenantId] || {
    id: tenantId,
    name: tenantId === 'tenant-1-alpha' ? 'Cliente Alpha' : tenantId === 'tenant-2-beta' ? 'Cliente Beta' : `Cliente ${tenantId}`,
    brandIdentity: '',
    toneOfVoice: 'Professional',
    brandBookText: ''
  };

  const updated: TenantContext = {
    ...current,
    ...contextUpdate,
    id: tenantId // Forzar que no cambie el id
  };

  db[tenantId] = updated;
  writeDb(db);
  return updated;
}

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
