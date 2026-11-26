/** Realm roles shared by every Yawar client. */
export const ROLES = [
  'donor',
  'recruitment',
  'logistics',
  'hospital',
  'administrator',
  'auditor',
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export const STAFF_ROLES: readonly Role[] = ROLES.filter((role) => role !== 'donor');

/**
 * Roles the UI acts on. Keycloak also grants `donor` to staff accounts, but donor endpoints reject
 * any token with a staff role, so a staff member is never treated as a donor.
 */
export function effectiveRoles(realmRoles: readonly string[]): Role[] {
  const roles = realmRoles.filter(isRole);
  const staff = roles.filter((role) => role !== 'donor');
  return staff.length > 0 ? staff : roles;
}
