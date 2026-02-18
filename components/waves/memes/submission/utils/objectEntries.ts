type ObjectEntries<T extends object> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T][];

export const objectEntries = <T extends object>(obj: T): ObjectEntries<T> =>
  Object.entries(obj) as ObjectEntries<T>;
