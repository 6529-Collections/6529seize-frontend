export interface DBResponse<T = any> {
  count: number;
  page: number;
  next: any;
  data: T[];
}
