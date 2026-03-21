interface EmailPasswordlessSignupArgs {
  id?: string;
  email: string;
  staticOTP?: string; // sometimes we want a static OTP for consistent test results
}

export type {
  EmailPasswordlessSignupArgs
}
