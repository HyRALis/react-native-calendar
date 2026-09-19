export type AuthUser = { id: string; email: string | null };
export type Credentials = { email: string; password: string };
export type AuthMode = 'signIn' | 'signUp';

export interface AuthService {
  subscribe(
    onUser: (user: AuthUser | null) => void,
    onError: (error: unknown) => void,
  ): () => void;
  signIn(credentials: Credentials): Promise<AuthUser>;
  signUp(credentials: Credentials): Promise<AuthUser>;
  signOut(): Promise<void>;
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
}
