import type { GenericUserPhoneArgs } from "./GenericUserPhoneArgs";

interface PhoneSignupArgs extends GenericUserPhoneArgs {
  id?: string;
  staticOTP?: string; // sometimes we want a static OTP for consistent test results
}

export type {
  PhoneSignupArgs
}