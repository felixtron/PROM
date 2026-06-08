// @ts-ignore
const pdf = require('pdf-parse');

/**
 * Extrae texto plano de un búfer binario de un archivo PDF.
 * @param buffer Búfer binario del PDF
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || '';
  } catch (error) {
    console.error('Error extrayendo texto del PDF:', error);
    throw new Error('No se pudo procesar el archivo PDF. Asegúrate de que no esté corrupto.');
  }
}
