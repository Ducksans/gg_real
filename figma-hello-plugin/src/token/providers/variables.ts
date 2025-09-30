import type { TokenProvider } from './types';

export const figmaVariableProvider: TokenProvider = {
  name: 'figma-variable',
  resolve: (_token: string) => {
    throw new Error('figmaVariableProvider.resolve not implemented');
  },
};
