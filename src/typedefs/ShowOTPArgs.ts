import type { Provider } from "./Provider";

interface ShowOTPArgs {
  userIdentifier: string; // user's phone number or email
  providerType: Provider;
}

export type {
  ShowOTPArgs
}

