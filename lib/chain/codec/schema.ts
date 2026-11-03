/**
 * Typed schemas for 6529chain's canonical encoding (CE).
 *
 * Source: 6529chain `design/canonical-encodings.md` (proposal P28) §2.6 for
 * the CE grammar and §7.6 for the EIP-712 mapping. A schema value describes
 * one CE type; `ValueOf<T>` is the TypeScript value it decodes to.
 *
 * Value conventions (chosen here, not by the design):
 * - unsigned and signed integers up to 32 bits are `number`; 64 bits and
 *   wider are `bigint`;
 * - `address`, `bytesN` and `bytes` are lowercase `0x` hex strings;
 * - `optional<T>` is `T`, with T's zero value meaning "absent". P28 §2.6
 *   forbids a present optional holding zero, so the mapping is bijective,
 *   and P28 §7.6 maps `optional<T>` to plain `T` in EIP-712.
 *
 * Every wire object is versioned by its schema name (EIP-712 primary type)
 * and its CE schemaId/version. A layout change is a new schema, never an
 * edit of this one (P28 §9 rule 1; P40 §3.7).
 */
import type { Hex } from "viem";

export type SmallIntBits = 8 | 16 | 32;
export type WideIntBits = 64 | 128 | 256;
export type IntBits = SmallIntBits | WideIntBits;

export interface UintType<B extends IntBits = IntBits> {
  readonly kind: "uint";
  readonly bits: B;
}

export interface IntType<B extends IntBits = IntBits> {
  readonly kind: "int";
  readonly bits: B;
}

export interface BoolType {
  readonly kind: "bool";
}

export interface AddressType {
  readonly kind: "address";
}

export interface FixedBytesType {
  readonly kind: "bytesN";
  readonly size: number;
}

export interface BytesType {
  readonly kind: "bytes";
  readonly max: number;
}

export interface StringType {
  readonly kind: "string";
  readonly max: number;
}

export interface ListType<I extends CeType = CeType> {
  readonly kind: "list";
  readonly item: I;
  readonly max: number;
}

export interface SetType<I extends CeType = CeType> {
  readonly kind: "set";
  readonly item: I;
  readonly max: number;
}

export interface OptionalType<I extends CeType = CeType> {
  readonly kind: "optional";
  readonly inner: I;
}

export type Field = readonly [name: string, type: CeType];
export type Fields = readonly Field[];

export interface StructType<
  N extends string = string,
  F extends Fields = Fields,
> {
  readonly kind: "struct";
  readonly name: N;
  readonly fields: F;
}

export type CeType =
  | UintType
  | IntType
  | BoolType
  | AddressType
  | FixedBytesType
  | BytesType
  | StringType
  | ListType
  | SetType
  | OptionalType
  | StructType;

type IntValue<B extends IntBits> = B extends SmallIntBits ? number : bigint;

type StructValue<F extends Fields> = {
  readonly [P in F[number][0]]: ValueOf<Extract<F[number], readonly [P, CeType]>[1]>;
};

/**
 * The decoded value of a schema. For the wide `CeType` union itself (a
 * schema not known at compile time) it is `unknown`, which also stops the
 * recursion through `ListType<CeType>` (TS2589).
 */
export type ValueOf<T extends CeType> = CeType extends T ? unknown : NarrowValueOf<T>;

type NarrowValueOf<T extends CeType> = T extends UintType<infer B>
  ? IntValue<B>
  : T extends IntType<infer B>
    ? IntValue<B>
    : T extends BoolType
      ? boolean
      : T extends AddressType | FixedBytesType | BytesType
        ? Hex
        : T extends StringType
          ? string
          : T extends ListType<infer I> | SetType<infer I>
            ? readonly ValueOf<I>[]
            : T extends OptionalType<infer I>
              ? ValueOf<I>
              : T extends StructType<string, infer F>
                ? StructValue<F>
                : never;

export const uint = <const B extends IntBits>(bits: B): UintType<B> => ({
  kind: "uint",
  bits,
});

export const int = <const B extends IntBits>(bits: B): IntType<B> => ({
  kind: "int",
  bits,
});

export const bool: BoolType = { kind: "bool" };
export const address: AddressType = { kind: "address" };

export const fixedBytes = (size: number): FixedBytesType => ({
  kind: "bytesN",
  size,
});

export const bytes = (max: number): BytesType => ({ kind: "bytes", max });
export const string = (max: number): StringType => ({ kind: "string", max });

export const list = <const I extends CeType>(
  item: I,
  max: number
): ListType<I> => ({ kind: "list", item, max });

export const set = <const I extends CeType>(
  item: I,
  max: number
): SetType<I> => ({ kind: "set", item, max });

export const optional = <const I extends CeType>(
  inner: I
): OptionalType<I> => ({ kind: "optional", inner });

export const struct = <const N extends string, const F extends Fields>(
  name: N,
  fields: F
): StructType<N, F> => ({ kind: "struct", name, fields });

export const u8 = uint(8);
export const u16 = uint(16);
export const u32 = uint(32);
export const u64 = uint(64);
export const u128 = uint(128);
export const i64 = int(64);
export const bytes16 = fixedBytes(16);
export const bytes32 = fixedBytes(32);

/** P40 §5.2: a CID field is CE `bytes` of at most 64 bytes. */
export const cidBytes = bytes(64);
