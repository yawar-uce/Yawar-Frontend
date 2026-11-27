import { createContext, useContext } from 'react';
import type { AuthClient, Session } from './AuthClient';

export type AuthState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; session: Session };

export type AuthContextValue = Pick<
  AuthClient,
  'login' | 'register' | 'loginWithGoogle' | 'logout' | 'getToken'
> & {
  state: AuthState;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
