export type JsonLdPrimitive = string | number | boolean | null;

export type JsonLdValue =
  | JsonLdPrimitive
  | JsonLdObject
  | readonly JsonLdValue[];

export interface JsonLdObject {
  readonly [key: string]: JsonLdValue | undefined;
}
