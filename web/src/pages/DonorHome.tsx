import { useQuery } from '@tanstack/react-query';
import { ApiError, getMyDonorProfile, type Consent } from '@yawar/shared';
import { useApi } from '../api/context';
import { useAuth } from '../auth/context';

const PURPOSES: Record<Consent['purpose'], string> = {
  DATA_PROCESSING: 'Tratamiento de datos personales',
};

const dateFormat = new Intl.DateTimeFormat('es-EC', { dateStyle: 'long' });

const statusOf = (error: Error) => (error instanceof ApiError ? error.status : 0);

/** Only failures that may pass on their own are worth repeating. */
const isTransient = (status: number) => status === 0 || status === 429 || status >= 500;

function messageFor(status: number): string {
  if (status === 401) return 'Tu sesión expiró. Vuelve a ingresar.';
  if (status === 403) return 'Tu cuenta no tiene acceso al portal del donante.';
  if (status === 422) {
    return 'No tenemos tu consentimiento para tratar tus datos, así que no guardamos tu perfil.';
  }
  if (status === 429) return 'Hiciste demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.';
  return 'No pudimos cargar tu perfil. El servicio no está disponible en este momento.';
}

export function DonorHome() {
  const api = useApi();
  const { state, login } = useAuth();
  const { data, error, refetch } = useQuery({
    queryKey: ['donors', 'me'],
    queryFn: () => getMyDonorProfile(api),
    retry: (failures, failure) => failures < 1 && isTransient(statusOf(failure)),
  });
  const name = state.status === 'authenticated' ? state.session.name : '';

  return (
    <>
      <h1>Portal del donante</h1>
      {name && <p>Hola, {name}.</p>}

      {!data && !error && <p role="status">Cargando tu perfil…</p>}

      {!data && error && (
        <div role="alert">
          <p>{messageFor(statusOf(error))}</p>
          {statusOf(error) === 401 && (
            <button type="button" onClick={() => void login('/donor')}>
              Ingresar de nuevo
            </button>
          )}
          {isTransient(statusOf(error)) && (
            <button type="button" onClick={() => void refetch()}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {data && (
        <>
          {data.dataAgeSeconds !== undefined && (
            <p role="status">Actualizado hace {data.dataAgeSeconds} s.</p>
          )}
          {!data.data.profileComplete && (
            <p className="notice">
              Tu perfil está incompleto. Podrás completarlo más adelante; no es obligatorio para
              continuar.
            </p>
          )}
          <h2>Consentimientos activos</h2>
          <ul>
            {data.data.consents.map((consent) => (
              <li key={consent.purpose}>
                {PURPOSES[consent.purpose] ?? consent.purpose}: política {consent.policyVersion},
                aceptado el {dateFormat.format(new Date(consent.grantedAt))}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
