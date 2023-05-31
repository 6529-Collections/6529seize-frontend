export type AllowlistToolResponse<T> =
  | T
  | { statusCode: number; message: string; error: string };
