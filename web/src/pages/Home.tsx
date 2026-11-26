import { Link } from 'react-router';
import { useAuth } from '../auth/context';

export function Home() {
  const { state } = useAuth();

  return (
    <>
      <h1>Yawar</h1>
      <p>Red de gestión de donación de sangre del Ecuador.</p>
      {state.status === 'authenticated' && (
        <p>
          {state.session.roles.includes('donor') ? (
            <Link to="/donor">Ir a mi portal de donante</Link>
          ) : (
            <Link to="/staff">Ir al portal del personal</Link>
          )}
        </p>
      )}
    </>
  );
}
