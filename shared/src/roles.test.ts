import { describe, expect, it } from 'vitest';
import { effectiveRoles, isRole, ROLES } from './roles';

describe('isRole', () => {
  it('accepts every Yawar realm role', () => {
    expect(ROLES.every(isRole)).toBe(true);
  });

  it('rejects Keycloak built-in roles', () => {
    expect(isRole('offline_access')).toBe(false);
  });
});

describe('effectiveRoles', () => {
  it('keeps donor for a donor and drops unknown roles', () => {
    expect(effectiveRoles(['donor', 'uma_authorization'])).toEqual(['donor']);
  });

  it('ignores the default donor role of a staff account', () => {
    expect(effectiveRoles(['donor', 'logistics'])).toEqual(['logistics']);
  });
});
