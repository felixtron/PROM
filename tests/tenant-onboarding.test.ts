import { describe, it, expect } from 'vitest';
import { getTenantContext, updateTenantContext } from '../src/lib/db';
import { extractTextFromPdf } from '../src/lib/pdf-reader';

describe('Módulo de Onboarding y Contexto de Marca (ProM)', () => {
  
  it('debe poder leer el perfil y onboarding por defecto de un Tenant', async () => {
    // Restauramos el estado por defecto para el test de lectura
    await updateTenantContext('tenant-1-alpha', {
      brandIdentity: 'Software de automatización de procesos de negocio (BPM)',
      toneOfVoice: 'Professional',
      activeBrief: {
        objective: 'Captación de Leads calificados para demostración comercial (Demo Booking).',
        audience: 'Directores de Operaciones',
        budget: 1500,
        kpis: 'CPL menor a $20 USD'
      }
    });

    const context = await getTenantContext('tenant-1-alpha');
    
    expect(context).toBeDefined();
    expect(context.id).toBe('tenant-1-alpha');
    expect(context.brandIdentity).toContain('automatización de procesos');
    expect(context.toneOfVoice).toBe('Professional');
    expect(context.activeBrief).toBeDefined();
    expect(context.activeBrief?.budget).toBe(1500);
  });

  it('debe poder actualizar la configuración de marca y onboarding del Tenant', async () => {
    const customBrief = {
      objective: 'Incrementar descargas del Whitepaper de automatización',
      audience: 'Gerentes de TI y CTOs en Bogotá',
      budget: 800,
      kpis: 'CPA de registro de $5.00 USD'
    };

    const updated = await updateTenantContext('tenant-1-alpha', {
      brandIdentity: 'Líder en ERP Cloud para pymes',
      toneOfVoice: 'Casual',
      activeBrief: customBrief
    });

    expect(updated.brandIdentity).toBe('Líder en ERP Cloud para pymes');
    expect(updated.toneOfVoice).toBe('Casual');
    expect(updated.activeBrief).toBeDefined();
    expect(updated.activeBrief?.objective).toBe('Incrementar descargas del Whitepaper de automatización');
    expect(updated.activeBrief?.budget).toBe(800);

    // Verificar persistencia al volver a cargar
    const reloaded = await getTenantContext('tenant-1-alpha');
    expect(reloaded.brandIdentity).toBe('Líder en ERP Cloud para pymes');
    expect(reloaded.toneOfVoice).toBe('Casual');
  });

  it('debe poder procesar e inyectar el contexto de onboarding en el AI Advisor', async () => {
    const sampleText = 'GUIA DE DISEÑO: Usar sólo colores pastel. Tipografía Arial.';
    const updated = await updateTenantContext('tenant-2-beta', {
      brandBookText: sampleText
    });

    expect(updated.brandBookText).toBe(sampleText);
    
    const reloaded = await getTenantContext('tenant-2-beta');
    expect(reloaded.brandBookText).toBe(sampleText);
  });
});
