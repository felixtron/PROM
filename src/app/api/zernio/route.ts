import { NextResponse } from 'next/server';
import { validateAuthHeaders } from '@/lib/auth';
import { publishToZernio } from '@/lib/zernio-client';

/**
 * Handler POST para publicar campañas orgánicas de forma segura y multi-tenant vía Zernio SDK.
 */
export async function POST(request: Request) {
  try {
    // 1. Extraer cabeceras HTTP
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    // 2. Validar autenticación y aislamiento estricto
    validateAuthHeaders(headersList);

    // 3. Procesar cuerpo del payload
    const body = await request.json();
    const { campaign_id, content, platforms } = body;

    // 4. Llamar al servicio de publicación
    const result = await publishToZernio(campaign_id, content, platforms);

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
