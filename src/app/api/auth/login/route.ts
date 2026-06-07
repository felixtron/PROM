import { NextResponse } from 'next/server';

/**
 * Endpoint de autenticación para Superusuarios y Consultores de ProM (ProSuite).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validación de credenciales del Superusuario de ProM
    if (email === 'consultant@prosuite.mx' && password === '***MOVIDO-A-ENV***') {
      return NextResponse.json({
        success: true,
        email,
        role: 'superuser',
        token: '***ELIMINADO***',
        tenantId: 'global-superuser'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
