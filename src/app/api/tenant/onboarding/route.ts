import { NextResponse } from 'next/server';
import { validateAuthHeaders } from '../../../../lib/auth';
import { getTenantContext, updateTenantContext } from '../../../../lib/db';

/**
 * GET handler to retrieve the current onboarding state of a Tenant
 */
export async function GET(request: Request) {
  try {
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    const session = validateAuthHeaders(headersList);
    const context = await getTenantContext(session.tenantId);

    return NextResponse.json({ success: true, context });
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

/**
 * POST handler to update onboarding or brand settings of a Tenant
 */
export async function POST(request: Request) {
  try {
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    const session = validateAuthHeaders(headersList);
    const body = await request.json();

    const { brandIdentity, toneOfVoice, activeBrief, name, brandBookText } = body;

    const updated = await updateTenantContext(session.tenantId, {
      ...(brandIdentity !== undefined && { brandIdentity }),
      ...(toneOfVoice !== undefined && { toneOfVoice }),
      ...(activeBrief !== undefined && { activeBrief }),
      ...(name !== undefined && { name }),
      ...(brandBookText !== undefined && { brandBookText }),
    });

    return NextResponse.json({ success: true, context: updated });
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
