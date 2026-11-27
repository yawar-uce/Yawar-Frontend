import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Keycloak from 'keycloak-js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { createApiClient } from '@yawar/shared';
import { ApiContext } from './api/context';
import { App } from './App';
import { AuthProvider } from './auth/AuthProvider';
import { createKeycloakAuth } from './auth/keycloakAuth';
import { apiUrl, keycloakConfig } from './config';
import './styles.css';

const queryClient = new QueryClient();
const auth = createKeycloakAuth(new Keycloak(keycloakConfig));
const api = createApiClient({ baseUrl: apiUrl, getToken: auth.getToken });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider client={auth}>
          <ApiContext.Provider value={api}>
            <App />
          </ApiContext.Provider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
