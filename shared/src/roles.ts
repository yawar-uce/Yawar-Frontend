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
