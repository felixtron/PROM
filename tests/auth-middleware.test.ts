import { describe, it, expect } from 'vitest';
import { validateAuthHeaders } from '../src/lib/auth';

describe('Módulo: Auth Middleware & Tenant Extraction', () => {
  it('debe arrojar error si falta la cabecera x-tenant-id', () => {
    const headers = { 'x-user-role': 'production' };
    expect(() => validateAuthHeaders(headers)).toThrow('HTTP 401 Unauthorized: Cabecera x-tenant-id ausente.');
  });

  it('debe arrojar error si falta la cabecera x-user-role', () => {
    const headers = { 'x-tenant-id': 'tenant-1-alpha' };
    expect(() => validateAuthHeaders(headers)).toThrow('HTTP 401 Unauthorized: Cabecera x-user-role ausente.');
  });

  it('debe retornar el tenantId y el rol si las cabeceras son correctas', () => {
    const headers = {
      'x-tenant-id': 'tenant-1-alpha',
      'x-user-role': 'production'
    };
    const session = validateAuthHeaders(headers);
    expect(session.tenantId).toBe('tenant-1-alpha');
    expect(session.role).toBe('production');
  });
});
