export type AuthUser = { id: string; email: string | null };
export type Credentials = { email: string; password: string };
export type AuthMode = 'signIn' | 'signUp';

export interface AuthService {
  subscribe(
    onUser: (user: AuthUser | null) => void,
    onError: (error: unknown) => void,
  ): () => void;
  signIn(credentials: Credentials): Promise<void>;
  signUp(credentials: Credentials): Promise<void>;
  signOut(): Promise<void>;
  getIdToken(): Promise<string | null>;
}
