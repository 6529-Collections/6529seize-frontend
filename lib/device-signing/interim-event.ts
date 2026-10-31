import { hashTypedData, keccak256, stringToBytes, type Hex } from "viem";

export const DeviceEventKind = {
  POST: 1,
  EDIT: 2,
  TOMBSTONE: 3,
  REACT: 4,
} as const;

export type DeviceEventKind =
  (typeof DeviceEventKind)[keyof typeof DeviceEventKind];

export type DeviceScope = "post" | "edit" | "delete" | "react" | "vote";

export const DEVICE_EVENT_KIND_SCOPE: Readonly<
  Record<DeviceEventKind, DeviceScope>
> = {
  [DeviceEventKind.POST]: "post",
  [DeviceEventKind.EDIT]: "edit",
  [DeviceEventKind.TOMBSTONE]: "delete",
  [DeviceEventKind.REACT]: "react",
};

export const INTERIM_EVENT_KIND_VERSION = 1;
export const ED25519_KEY_TYPE = 2;

const INTERIM_EVENT_DOMAIN = {
  name: "6529 Network P2P",
  version: "1",
  salt: keccak256(stringToBytes("6529 Network pre-genesis interim 1")),
} as const;

const INTERIM_EVENT_TYPES = {
  InterimEvent: [
    { name: "kind", type: "uint16" },
    { name: "kindVersion", type: "uint16" },
    { name: "wave", type: "string" },
    { name: "author", type: "address" },
    { name: "keyType", type: "uint8" },
    { name: "deviceKey", type: "bytes32" },
    { name: "authRef", type: "bytes32" },
    { name: "seq", type: "uint64" },
    { name: "anchor", type: "uint64" },
    { name: "claimedTime", type: "uint64" },
    { name: "refs", type: "string[]" },
    { name: "bodyHash", type: "bytes32" },
    { name: "bodySize", type: "uint32" },
  ],
} as const;

interface InterimEventFields {
  readonly kind: number;
  readonly kindVersion: number;
  readonly wave: string;
  /** Lowercase grant wallet. */
  readonly author: string;
  readonly keyType: number;
  readonly deviceKey: string;
  /** Device grant id. */
  readonly authRef: string;
  readonly seq: number;
  readonly anchor: number;
  readonly claimedTime: number;
  readonly refs: readonly string[];
  readonly bodyHash: string;
  readonly bodySize: number;
}

/** EIP-712 digest of an interim (pre-genesis) network event. */
export function computeInterimEventId(fields: InterimEventFields): Hex {
  return hashTypedData({
    domain: INTERIM_EVENT_DOMAIN,
    types: INTERIM_EVENT_TYPES,
    primaryType: "InterimEvent",
    message: {
      kind: fields.kind,
      kindVersion: fields.kindVersion,
      wave: fields.wave,
      author: fields.author as Hex,
      keyType: fields.keyType,
      deviceKey: fields.deviceKey as Hex,
      authRef: fields.authRef as Hex,
      seq: BigInt(fields.seq),
      anchor: BigInt(fields.anchor),
      claimedTime: BigInt(fields.claimedTime),
      refs: [...fields.refs],
      bodyHash: fields.bodyHash as Hex,
      bodySize: fields.bodySize,
    },
  });
}
