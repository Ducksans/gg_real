import type { TokenProvider } from './providers';

/**
 * 토큰 공급자 레지스트리 스텁.
 */
export const registerTokenProviders = (_providers: TokenProvider[]) => {
  throw new Error('registerTokenProviders not implemented');
};

export const resolveTokenWithProviders = (_token: string, _providers: TokenProvider[]) => {
  throw new Error('resolveTokenWithProviders not implemented');
};
