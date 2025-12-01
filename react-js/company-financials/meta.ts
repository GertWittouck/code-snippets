import { getJson } from './client.ts';
import { SupplyChainType } from './constants.ts';
import { SERVICE_GET_CURRENCIES } from './paths.ts';
import type { GetCurrenciesResponse } from './types.ts';

export function fetchCurrencies(country: string, signal?: AbortSignal) {
  return getJson<GetCurrenciesResponse>(SERVICE_GET_CURRENCIES(country), {
    signal,
  });
}
