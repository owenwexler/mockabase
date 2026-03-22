import type { Provider } from "./Provider";

interface AssignOTPArgs {
  providerType: Provider;
  email?: string;
  phoneNumber?: string;
  staticOTP?: string;
}

export type {
  AssignOTPArgs
}