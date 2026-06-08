import { NextResponse } from 'next/server';
import { verifySession, AuthError } from '../../../../lib/auth';
import { getTenantContext, updateTenantContext } from '../../../../lib/db';

export const runtime = 'nodejs';

function headersToObject(request: Request): Record<string, string> {
  const headersList: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersList[key] = value;
  });
  return headersList;
}

function handleError(error: unknown, where: string) {
  if (error instanceof AuthError) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }
  console.error(`Error en ${where}:`, error);
  return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
}

/** GET: estado de onboarding del Tenant de la sesión. */
export async function GET(request: Request) {
  try {
    const session = await verifySession(headersToObject(request));
    const context = await getTenantContext(session.tenantId);
    return NextResponse.json({ success: true, context });
  } catch (error) {
    return handleError(error, 'GET /api/tenant/onboarding');
  }
}

/** POST: actualiza configuración de marca/brief del Tenant de la sesión. */
export async function POST(request: Request) {
  try {
    const session = await verifySession(headersToObject(request));
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Cuerpo inválido.' }, { status: 400 });
    }

    const { brandIdentity, toneOfVoice, activeBrief, name, brandBookText } = body;

    const updated = await updateTenantContext(session.tenantId, {
      ...(typeof brandIdentity === 'string' && { brandIdentity }),
      ...(typeof toneOfVoice === 'string' && { toneOfVoice }),
      ...(activeBrief !== undefined && { activeBrief }),
      ...(typeof name === 'string' && { name }),
      ...(typeof brandBookText === 'string' && { brandBookText }),
    });

    return NextResponse.json({ success: true, context: updated });
  } catch (error) {
    return handleError(error, 'POST /api/tenant/onboarding');
  }
}
