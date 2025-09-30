import type { TokenProvider } from './types';

export const figmaStyleProvider: TokenProvider = {
  name: 'figma-style',
  resolve: (_token: string) => {
    throw new Error('figmaStyleProvider.resolve not implemented');
  },
};
