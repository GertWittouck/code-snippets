export const PATH_BASE = '/verification';
export const PATH_BASE_API = `${PATH_BASE}/api/v1`;
export const PATH_LOGIN = PATH_BASE + '/login';

/**
 * Backend Population
 */
export const SERVICE_GET_CURRENCIES = (country: string) =>
  `${PATH_BASE_API}/currencies?country=${encodeURIComponent(country)}`;
export const SERVICE_GET_BANK_CURRENCIES = (country: string) =>
  `${PATH_BASE_API}/currencies/bank-account?country=${encodeURIComponent(country)}`;
