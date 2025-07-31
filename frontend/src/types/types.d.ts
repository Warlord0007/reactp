// types/AuthTypes.ts
export interface DecodedUser {
  id: string;
  name: string;
  email: string;
  exp: number; // token expiration
  // Add any other fields your JWT has
}

export interface AuthContextType {
  user: DecodedUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}
