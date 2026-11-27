import type { ApiClient } from '@yawar/shared';
import { createContext, useContext } from 'react';

export const ApiContext = createContext<ApiClient | null>(null);

export function useApi(): ApiClient {
  const value = useContext(ApiContext);
  if (!value) throw new Error('useApi must be used inside ApiContext');
  return value;
}
