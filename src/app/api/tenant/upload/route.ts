import { NextResponse } from 'next/server';
import { verifySession, AuthError } from '../../../../lib/auth';
import { updateTenantContext } from '../../../../lib/db';
import { extractTextFromPdf } from '../../../../lib/pdf-reader';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_CHARS = 50000;
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.json'];

/**
 * Sube la guía de diseño en PDF/TXT, extrae su texto y lo asocia al contexto de marca.
 */
export async function POST(request: Request) {
  try {
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    const session = await verifySession(headersList);

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    const fileName = file.name || 'archivo';
    const lowerName = fileName.toLowerCase();
    const ext = ALLOWED_EXTENSIONS.find((e) => lowerName.endsWith(e));

    if (!ext) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no permitido. Usa PDF, TXT, MD o JSON.' },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'El archivo excede el tamaño máximo permitido (10 MB).' },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = '';
    if (ext === '.pdf') {
      extractedText = await extractTextFromPdf(buffer);
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (extractedText.length > MAX_TEXT_CHARS) {
      extractedText = extractedText.substring(0, MAX_TEXT_CHARS) +
        '\n\n[...Texto truncado por exceder límite de 50k caracteres...]';
    }

    const updated = await updateTenantContext(session.tenantId, { brandBookText: extractedText });

    return NextResponse.json({
      success: true,
      fileName,
      textLength: extractedText.length,
      brandBookTextSnippet: extractedText.substring(0, 300) + '...',
      context: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
    }
    console.error('Error en /api/tenant/upload:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar el archivo.' }, { status: 500 });
  }
}
