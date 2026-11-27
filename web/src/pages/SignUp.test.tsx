import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/context';
import { SignUp } from './SignUp';

function renderSignUp() {
  const auth: AuthContextValue = {
    state: { status: 'anonymous' },
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn(),
  };
  render(
    <AuthContext.Provider value={auth}>
      <SignUp />
    </AuthContext.Provider>,
  );
  return auth;
}

const typeEmail = (value: string) =>
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value } });
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const acceptConsent = () => fireEvent.click(screen.getByRole('checkbox'));

afterEach(cleanup);

describe('SignUp', () => {
  it('hu01_sc1 continues to Keycloak with the email once consent is accepted', () => {
    const auth = renderSignUp();
    typeEmail('  ana@example.test ');
    acceptConsent();

    press('Continuar con correo');

    expect(auth.register).toHaveBeenCalledWith('/donor', 'ana@example.test');
  });

  it('hu01_sc3 does not continue without consent and explains why', () => {
    const auth = renderSignUp();
    typeEmail('ana@example.test');

    press('Continuar con correo');

    expect(screen.getByRole('alert').textContent).toContain('Necesitamos tu consentimiento');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', () => {
    const auth = renderSignUp();
    typeEmail('ana');
    acceptConsent();

    press('Continuar con correo');

    expect(screen.getByRole('alert').textContent).toBe('Escribe un correo electrónico válido.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('hu02_sc1 goes to Google without any mandatory form', () => {
    const auth = renderSignUp();

    press('Continuar con Google');

    expect(auth.loginWithGoogle).toHaveBeenCalledWith('/donor');
  });

  it('lets an existing donor sign in', () => {
    const auth = renderSignUp();

    press('Ingresar');

    expect(auth.login).toHaveBeenCalledWith('/donor');
  });
});
