export interface TokenProvider {
  readonly name: string;
  resolve: (token: string) => unknown;
}
