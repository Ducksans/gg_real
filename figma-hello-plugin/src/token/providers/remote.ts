import type { TokenProvider } from './types';

export const remoteTokenProvider: TokenProvider = {
  name: 'remote-token',
  resolve: (_token: string) => {
    throw new Error('remoteTokenProvider.resolve not implemented');
  },
};
