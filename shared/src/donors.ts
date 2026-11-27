import type { ApiClient } from './api';

/** An active consent, as published by ms-donors (docs/openapi/ms-donors.yaml). */
export interface Consent {
  purpose: 'DATA_PROCESSING';
  policyVersion: string;
  grantedAt: string;
}

export interface DonorProfile {
  id: string;
  profileComplete: boolean;
  consents: Consent[];
}

/** Own profile; the first call creates it from the consent carried by the token. */
export function getMyDonorProfile(api: ApiClient) {
  return api.request<DonorProfile>('/api/v1/donors/me');
}
