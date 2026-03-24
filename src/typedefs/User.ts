import type { OAuthProvider } from "./OAuthProvider";
import type { Provider } from "./Provider";

interface User {
  id: string;
  email: string | null;
  password?: string | null;
  encryptedPassword: string | null;
  phoneNumber: string | null;
  providerType: Provider;
  oauthProvider: OAuthProvider | null;
  otp: string | null;
}

export type {
  User
}
