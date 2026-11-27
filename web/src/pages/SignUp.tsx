import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/context';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AFTER_SIGN_UP = '/donor';

/**
 * Entry point of both sign-up paths. The account, the password and the legally recorded consent
 * belong to Keycloak; this screen never handles a password.
 */
export function SignUp() {
  const { register, login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !EMAIL.test(email.trim());
  const consentError = submitted && !consent;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (EMAIL.test(email.trim()) && consent) void register(AFTER_SIGN_UP, email.trim());
  }

  return (
    <>
      <h1>Crea tu cuenta de donante</h1>

      <button type="button" onClick={() => void loginWithGoogle(AFTER_SIGN_UP)}>
        Continuar con Google
      </button>
      <p>Al volver de Google te pediremos tu consentimiento. No hay otros datos obligatorios.</p>

      <h2>O regístrate con tu correo</h2>
      <form noValidate onSubmit={submit}>
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError && (
          <p id="email-error" className="error" role="alert">
            Escribe un correo electrónico válido.
          </p>
        )}

        <p className="check">
          <input
            id="consent"
            type="checkbox"
            required
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            aria-invalid={consentError}
            aria-describedby={consentError ? 'consent-error' : undefined}
          />
          <label htmlFor="consent">
            Acepto el tratamiento de mis datos personales por Yawar según la LOPDP
          </label>
        </p>
        {consentError && (
          <p id="consent-error" className="error" role="alert">
            Necesitamos tu consentimiento para tratar tus datos (LOPDP) y crear tu cuenta.
          </p>
        )}

        <p>En los siguientes pasos confirmarás el consentimiento, verificarás tu correo y crearás tu contraseña.</p>
        <button type="submit">Continuar con correo</button>
      </form>

      <p>
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={() => void login(AFTER_SIGN_UP)}>
          Ingresar
        </button>
      </p>
    </>
  );
}
