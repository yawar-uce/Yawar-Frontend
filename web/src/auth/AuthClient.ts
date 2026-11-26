import type { Role } from '@yawar/shared';

export interface Session {
  name: string;
  roles: Role[];
}

/** Identity operations the UI needs, independent of the OIDC library. */
export interface AuthClient {
  /** Restores an existing single sign-on session or completes a login redirect. */
  init(): Promise<Session | null>;
  login(returnTo: string): Promise<void>;
  logout(): Promise<void>;
  /** A valid access token, refreshed if it is about to expire. */
  getToken(): Promise<string | undefined>;
  onSessionEnd(listener: () => void): () => void;
}
