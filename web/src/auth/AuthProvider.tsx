import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthClient } from './AuthClient';
import { AuthContext, type AuthState } from './context';

interface Props {
  client: AuthClient;
  children: ReactNode;
}

export function AuthProvider({ client, children }: Props) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const unsubscribe = client.onSessionEnd(() => setState({ status: 'anonymous' }));
    client.init().then(
      (session) => {
        if (!active) return;
        setState(session ? { status: 'authenticated', session } : { status: 'anonymous' });
      },
      () => {
        if (active) setState({ status: 'error' });
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [client]);

  const value = useMemo(
    () => ({
      state,
      login: client.login,
      register: client.register,
      loginWithGoogle: client.loginWithGoogle,
      logout: client.logout,
      getToken: client.getToken,
    }),
    [client, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
