import type { User } from "./User";

export type ShowOTPResult = Pick<User, 'email' | 'phoneNumber' | 'otp'>;