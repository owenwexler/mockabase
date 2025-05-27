import type { ErrorType } from "./ErrorType";
import type { Session } from "./Session";

interface ReturnObject {
  data: { user: Session } | null;
  error: ErrorType | null;
}

export type {
  ReturnObject
}
