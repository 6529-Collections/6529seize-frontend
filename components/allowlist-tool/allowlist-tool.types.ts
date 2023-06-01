export type AllowlistToolResponse<T> =
  | T
  | { statusCode: number; message: string | string[]; error: string };
