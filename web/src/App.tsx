import { STAFF_ROLES } from '@yawar/shared';
import { Link, Navigate, Route, Routes } from 'react-router';
import { useAuth } from './auth/context';
import { RequireRole } from './auth/RequireRole';
import { readReturnTo } from './auth/returnTo';
import { Home } from './pages/Home';

export function App() {
  const { state, login, logout } = useAuth();

  return (
    <>
      <header>
        <nav aria-label="Principal">
          <Link to="/">Inicio</Link>
          {state.status === 'authenticated' && (
            <>
              <span>{state.session.name}</span>
              <button type="button" onClick={() => void logout()}>
                Cerrar sesión
              </button>
            </>
          )}
          {state.status === 'anonymous' && (
            <button type="button" onClick={() => void login('/')}>
              Iniciar sesión
            </button>
          )}
        </nav>
      </header>
      <main>
        {state.status === 'loading' && <p role="status">Cargando…</p>}
        {state.status === 'error' && (
          <div role="alert">
            <p>No pudimos conectar con el servicio de acceso.</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        )}
        {/* Routes wait for Keycloak, which reads the login response from the URL. */}
        {(state.status === 'anonymous' || state.status === 'authenticated') && (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/callback" element={<Navigate to={readReturnTo()} replace />} />
            <Route
              path="/donor"
              element={
                <RequireRole allowed={['donor']}>
                  <h1>Portal del donante</h1>
                </RequireRole>
              }
            />
            <Route
              path="/staff"
              element={
                <RequireRole allowed={STAFF_ROLES}>
                  <h1>Portal del personal</h1>
                </RequireRole>
              }
            />
            <Route path="*" element={<h1>Página no encontrada</h1>} />
          </Routes>
        )}
      </main>
    </>
  );
}
