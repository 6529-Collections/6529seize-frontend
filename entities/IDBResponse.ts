export interface DBResponse<T = any> {
  count: number;
  page: number;
  next: unknown;
  data: T[];
}
