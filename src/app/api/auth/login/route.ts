import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { signSession } from '../../../../lib/jwt';

/**
 * Endpoint de autenticación para el Consultor/Superusuario de ProM.
 *
 * Las credenciales se leen de variables de entorno (ADMIN_EMAIL / ADMIN_PASSWORD),
 * nunca incrustadas en el código. Tras validar, se emite un JWT firmado de corta
 * vigencia en lugar de un token estático.
 */
export const runtime = 'nodejs';

/** Comparación en tiempo constante para evitar ataques de timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // timingSafeEqual exige longitudes iguales; comparamos contra sí mismo para no filtrar por longitud.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Auth mal configurada: ADMIN_EMAIL/ADMIN_PASSWORD ausentes.');
      return NextResponse.json(
        { success: false, error: 'Servicio de autenticación no disponible.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    const validUser = safeEqual(email, adminEmail);
    const validPass = safeEqual(password, adminPassword);

    if (!validUser || !validPass) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas.' },
        { status: 401 }
      );
    }

    const token = await signSession({ role: 'superuser', tenantId: 'global-superuser' });

    return NextResponse.json({
      success: true,
      email,
      role: 'superuser',
      token,
      tenantId: 'global-superuser',
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno de autenticación.' },
      { status: 500 }
    );
  }
}
