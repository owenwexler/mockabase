import type { User } from "./User";

export type NewUser = Omit<User, 'encryptedPassword'>;