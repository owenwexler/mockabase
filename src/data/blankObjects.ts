import type { Session } from "../typedefs/Session";
import type { User } from "../typedefs/User";

const blankUser: User = {
  id: '',
  email: null,
  encryptedPassword: null,
  phoneNumber: null,
  providerType: 'email-password',
  oauthProvider: null,
  otp: null
}

const blankSession: Session = {
  id: blankUser.id,
  email: blankUser.email,
  phoneNumber: blankUser.phoneNumber,
  providerType: blankUser.providerType,
  oauthProvider: blankUser.oauthProvider
}

export {
  blankUser,
  blankSession
}
