import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { getTenantContext } from './db';

const execFileAsync = promisify(execFile);

/**
 * Parsea un archivo de entorno (KEY=VALUE) y lo devuelve como objeto, sin pasar
 * por un shell. Reemplaza el inseguro `source ${envPath}` que permitía inyección.
 */
function loadEnvFile(envPath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    if (!fs.existsSync(envPath)) return result;
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      // Quitar comillas envolventes si las hubiera
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key) result[key] = value;
    }
  } catch (e) {
    console.error('No se pudo leer el archivo de entorno del Advisor:', e);
  }
  return result;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
}

export interface AIAnalysisResult {
  success: boolean;
  ctr: string;
  recommendations: string[];
}

/**
 * Analiza métricas de pauta publicitaria (Meta o Google) llamando en tiempo real
 * a la CLI de OpenCode cargando el modelo Kimi-k2.6, adaptando los resultados de forma quirúrgica
 * al contexto del cliente (Brand Guidelines, Tono y Brief).
 * @param metrics Objeto que contiene impressions, clicks y spend de la campaña
 * @param tenantId ID del tenant asociado para inyectar su contexto de marca
 */
export async function analyzeCampaignMetrics(metrics: CampaignMetrics, tenantId: string): Promise<AIAnalysisResult> {
  const { impressions, clicks, spend } = metrics;
  
  // Calcular CTR matemático básico
  const ctrValue = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const ctr = `${ctrValue.toFixed(2)}%`;

  // 1. Cargar contexto de marca y onboarding del Tenant de forma persistente
  let brandContextPrompt = '';
  try {
    const tenant = await getTenantContext(tenantId);
    
    brandContextPrompt = `
CONTEXTO DE LA MARCA DEL CLIENTE (${tenant.name}):
- Propuesta de Valor y Actividad: ${tenant.brandIdentity || 'No provista'}
- Tono de Voz Elegido: ${tenant.toneOfVoice || 'Professional'}
${tenant.brandBookText ? `- Guía de Diseño / Brandbook (Texto Extraído): ${tenant.brandBookText}` : ''}

${tenant.activeBrief ? `OBJETIVO ACTUAL DE LA CAMPAÑA:
- Objetivo Comercial: ${tenant.activeBrief.objective || 'No provisto'}
- Audiencia Objetivo: ${tenant.activeBrief.audience || 'No provista'}
- Presupuesto Mensual: $${tenant.activeBrief.budget || 0} USD
- KPI de Éxito: ${tenant.activeBrief.kpis || 'No provisto'}` : ''}
`;
  } catch (error) {
    console.error('Error inyectando contexto de marca al Advisor:', error);
  }

  // 2. Construir el prompt estructurado enriquecido para Kimi-k2.6
  const prompt = `Actúas como el Director Creativo y Consultor de Growth Marketing Senior de ProSuite.
Analiza las métricas de campaña y compáralas con la identidad, el tono de marca y los objetivos del cliente descritos abajo.

${brandContextPrompt}

MÉTRICAS DEL DESEMPEÑO PUBLICITARIO EN TIEMPO REAL:
- Impresiones: ${impressions}
- Clics de usuario: ${clicks}
- CTR (Click-Through Rate): ${ctr}
- Presupuesto consumido: $${spend} USD

Instrucciones de análisis:
1. Revisa si el CTR (${ctr}) es adecuado para el canal, la audiencia y los KPIs descritos en el objetivo del cliente.
2. Basándote en el Tono de Voz (${brandContextPrompt ? 'descrito en el contexto de marca' : 'profesional'}) y la Guía de Diseño, genera exactamente dos recomendaciones tácticas, personalizadas e hiper-específicas para mejorar el rendimiento de la pauta.
3. Responde ÚNICAMENTE con un bloque JSON que tenga la siguiente estructura (no agregues texto introductorio, ni markdown de bloques \`\`\`json, solo el JSON de recomendaciones):
{
  "recommendations": [
    "Recomendación 1...",
    "Recomendación 2..."
  ]
}`;

  try {
    const envPath = process.env.OPENCODE_ENV_PATH || '/opt/data/.opencode.env';

    // SEGURIDAD: el prompt contiene datos controlados por el cliente (brandBookText,
    // brandIdentity, etc.). NUNCA debe interpolarse en una línea de comando de shell.
    // Usamos execFile (sin shell) pasando el prompt como un único argumento argv,
    // por lo que metacaracteres como $(...), `...`, ;, |, & no se interpretan.
    const childEnv = { ...process.env, ...loadEnvFile(envPath) };

    const { stdout } = await execFileAsync(
      'opencode',
      ['run', prompt, '--model', 'opencode/kimi-k2.6', '--max-turns', '1'],
      {
        env: childEnv,
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      }
    );
    
    // Limpiar salida en caso de que traiga bloques markdown de código ```json o texto explicativo
    let cleanJson = stdout.trim();
    if (cleanJson.includes('```')) {
      const match = cleanJson.match(/```(?:json)?([\s\S]*?)```/);
      if (match) {
        cleanJson = match[1].trim();
      }
    }

    const parsed = JSON.parse(cleanJson);
    
    return {
      success: true,
      ctr,
      recommendations: parsed.recommendations || [
        "Revisa la segmentación de la audiencia actual contra los KPIs especificados.",
        "Ajusta la paleta de colores y el copy creativo del anuncio para alinearlo al tono de voz de la marca."
      ]
    };
  } catch (error) {
    // Fallback inteligente adaptado al tono y objetivo si hay timeout de API
    return {
      success: true,
      ctr,
      recommendations: [
        `[Advisor Fallback] Se detecta un CTR de ${ctr} en las campañas. Se aconseja re-estructurar los creativos de anuncios gráficos para alinearlos con la guía de marca y asegurar el llamado a la acción (CTA) deseado.`,
        `[Advisor Fallback] El gasto acumulado es de $${spend} USD. Se recomienda auditar la concordancia de palabras clave en Google Ads o segmentación demográfica en Meta Ads para optimizar el alcance.`
      ]
    };
  }
}
