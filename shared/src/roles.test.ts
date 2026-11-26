import { describe, expect, it } from 'vitest';
import { isRole, ROLES } from './roles';

describe('isRole', () => {
  it('accepts every Yawar realm role', () => {
    expect(ROLES.every(isRole)).toBe(true);
  });

  it('rejects Keycloak built-in roles', () => {
    expect(isRole('offline_access')).toBe(false);
  });
});
