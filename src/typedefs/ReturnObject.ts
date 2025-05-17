import type { ErrorType } from "./ErrorType";
import type { Session } from "./Session";

interface ReturnObject {
  data: Session | null;
  error: ErrorType;
}

export type {
  ReturnObject
}
