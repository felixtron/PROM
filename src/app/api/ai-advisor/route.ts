import { NextResponse } from 'next/server';
import { verifySession, AuthError } from '../../../lib/auth';
import { analyzeCampaignMetrics } from '../../../lib/ai-advisor';

export const runtime = 'nodejs';

/** Valida que las métricas sean números finitos no negativos. */
function parseMetrics(input: any): { impressions: number; clicks: number; spend: number } | null {
  if (!input || typeof input !== 'object') return null;
  const fields = ['impressions', 'clicks', 'spend'] as const;
  const out: any = {};
  for (const f of fields) {
    const n = Number(input[f]);
    if (!Number.isFinite(n) || n < 0) return null;
    out[f] = n;
  }
  return out;
}

/**
 * Handler POST para delegar el análisis de pauta a Kimi-k2.6 vía OpenCode CLI.
 */
export async function POST(request: Request) {
  try {
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    const session = await verifySession(headersList);

    const body = await request.json().catch(() => null);
    const metrics = parseMetrics(body?.metrics);

    if (!metrics) {
      return NextResponse.json(
        { success: false, error: 'Métricas inválidas o ausentes.' },
        { status: 400 }
      );
    }

    const result = await analyzeCampaignMetrics(metrics, session.tenantId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
    }
    console.error('Error en /api/ai-advisor:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}
