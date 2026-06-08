import { NextResponse } from 'next/server';
import { validateAuthHeaders } from '../../../lib/auth';
import { analyzeCampaignMetrics } from '../../../lib/ai-advisor';

/**
 * Handler POST para delegar el análisis de pauta de forma real a Kimi-k2.6 usando OpenCode CLI.
 */
export async function POST(request: Request) {
  try {
    // 1. Extraer cabeceras HTTP
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    // 2. Validar autenticación
    const session = validateAuthHeaders(headersList);

    // 3. Procesar cuerpo del payload
    const body = await request.json();
    const { metrics } = body;

    if (!metrics) {
      return NextResponse.json({ success: false, error: 'Métricas ausentes.' }, { status: 400 });
    }

    // 4. Invocar el análisis del consultor de IA pasando el Tenant ID para contextualizar la marca
    const result = await analyzeCampaignMetrics(metrics, session.tenantId);

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
