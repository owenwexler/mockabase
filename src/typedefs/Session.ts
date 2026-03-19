import type { OAuthProvider } from "./OAuthProvider";

interface Session {
  id: string;
  email?: string;
  phoneNumber?: string;
  oauthProvider?: OAuthProvider;
}

export type {
  Session
}
