import type { Role } from '@yawar/shared';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from './context';

interface Props {
  allowed: readonly Role[];
  children: ReactNode;
}

/** UI guard only: the gateway and each service enforce the roles again. */
export function RequireRole({ allowed, children }: Props) {
  const { state, login } = useAuth();
  const location = useLocation();

  if (state.status !== 'authenticated') {
    return (
      <>
        <h1>Inicia sesión para continuar</h1>
        <button type="button" onClick={() => void login(location.pathname + location.search)}>
          Iniciar sesión
        </button>
      </>
    );
  }

  if (!state.session.roles.some((role) => allowed.includes(role))) {
    return (
      <>
        <h1>Acceso no autorizado</h1>
        <p>Tu cuenta no tiene permiso para ver esta página.</p>
      </>
    );
  }

  return children;
}
