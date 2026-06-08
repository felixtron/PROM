import { NextResponse } from 'next/server';
import { verifySession, AuthError } from '@/lib/auth';
import { getCampaignById } from '@/lib/db';
import { publishToZernio } from '@/lib/zernio-client';

export const runtime = 'nodejs';

const ALLOWED_PLATFORMS = new Set([
  'telegram', 'twitter', 'instagram', 'facebook', 'linkedin',
  'tiktok', 'youtube', 'pinterest', 'reddit', 'bluesky', 'threads',
]);

/**
 * Handler POST para publicar campañas orgánicas de forma segura y multi-tenant.
 */
export async function POST(request: Request) {
  try {
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    const session = await verifySession(headersList);

    const body = await request.json().catch(() => null);
    const campaignId = typeof body?.campaign_id === 'string' ? body.campaign_id : '';
    const content = typeof body?.content === 'string' ? body.content : '';
    const platforms = Array.isArray(body?.platforms) ? body.platforms : [];

    if (!campaignId || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Payload inválido.' }, { status: 400 });
    }

    // Validar y normalizar plataformas contra una lista blanca
    const validPlatforms = platforms.filter(
      (p: unknown): p is string => typeof p === 'string' && ALLOWED_PLATFORMS.has(p)
    );
    if (validPlatforms.length === 0) {
      return NextResponse.json({ success: false, error: 'Plataformas inválidas.' }, { status: 400 });
    }

    // CONTROL DE ACCESO (anti-IDOR): la campaña debe pertenecer al tenant de la sesión.
    // getCampaignById lanza 404 si no existe o 403 si pertenece a otro tenant.
    await getCampaignById(campaignId, session.tenantId);

    const result = await publishToZernio(campaignId, content, validPlatforms);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : '';
    if (message.includes('403')) {
      return NextResponse.json({ success: false, error: 'Acceso denegado a esta campaña.' }, { status: 403 });
    }
    if (message.includes('404')) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada.' }, { status: 404 });
    }
    console.error('Error en /api/zernio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}
