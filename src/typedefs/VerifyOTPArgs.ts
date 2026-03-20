import type { AssignOTPArgs } from "./AssignOTPArgs";

interface VerifyOTPArgs extends AssignOTPArgs {
  otp: string;
}

export type {
  VerifyOTPArgs
}