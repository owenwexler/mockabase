import type { User } from "./User";

export type Session = Pick<User, 'id' | 'email' | 'phoneNumber' | 'providerType' | 'oauthProvider'>;