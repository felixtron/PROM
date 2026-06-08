import { NextResponse } from 'next/server';
import { validateAuthHeaders } from '../../../../lib/auth';
import { updateTenantContext } from '../../../../lib/db';
import { extractTextFromPdf } from '../../../../lib/pdf-reader';

/**
 * Endpoint para subir la guía de diseño o catálogo en PDF o archivo de texto (.txt)
 * Extrae su texto y lo asocia permanentemente al contexto de marca del Tenant.
 */
export async function POST(request: Request) {
  try {
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    const session = validateAuthHeaders(headersList);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = '';

    if (file.name.toLowerCase().endsWith('.pdf')) {
      extractedText = await extractTextFromPdf(buffer);
    } else {
      // Intentar leer como texto plano (.txt, .md, .json)
      extractedText = buffer.toString('utf-8');
    }

    // Limitar texto para que no sea inmanejable en los prompts (máximo 50,000 caracteres)
    if (extractedText.length > 50000) {
      extractedText = extractedText.substring(0, 50000) + '\n\n[...Texto truncado por exceder límite de 50k caracteres...]';
    }

    // Actualizar base de datos de Tenant de forma persistente
    const updated = await updateTenantContext(session.tenantId, {
      brandBookText: extractedText
    });

    return NextResponse.json({ 
      success: true, 
      fileName: file.name,
      textLength: extractedText.length,
      brandBookTextSnippet: extractedText.substring(0, 300) + '...',
      context: updated
    });
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
