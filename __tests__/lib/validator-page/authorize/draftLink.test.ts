/** @jest-environment node */
import { hashTypedData, recoverTypedDataAddress, type Hex } from "viem";

import { decodeDraftLink } from "@/lib/validator-page/authorize/draftLink";
import {
  checkTypedData,
  grantDigest,
  MAINNET_SALT,
  toSignableTypedData,
  type GrantTypedData,
} from "@/lib/validator-page/authorize/typedData";

import fixture from "./fixture-grant.json";

// The fixture's link was made by the validator's reference encoder.
const FRAGMENT = fixture.link.split("#")[1]!;

type Fields = {
  format?: number;
  network?: number;
  salt?: string;
  account?: string;
  authVersion?: Uint8Array;
  refBlockNumber?: Uint8Array;
  refBlockHash?: string;
  n?: number;
  mine?: number;
  keys?: { pubkey: string; share: number }[];
  extra?: number[];
  cut?: number;
};

function bytesOf(hex: string): number[] {
  return Array.from(Buffer.from(hex.replace(/^0x/, ""), "hex"));
}

function leb128(value: bigint): Uint8Array {
  const out: number[] = [];
  let rest = value;
  do {
    const low = Number(rest & 0x7fn);
    rest >>= 7n;
    out.push(rest === 0n ? low : low | 0x80);
  } while (rest !== 0n);
  return Uint8Array.from(out);
}

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Sets one of the bits a 112-byte link's last character doesn't use. */
function withSpareBit(fragment: string): string {
  expect(fragment.length % 4).toBe(2);
  const last = ALPHABET.indexOf(fragment.at(-1)!);
  return `${fragment.slice(0, -1)}${ALPHABET[last ^ 1]}`;
}

const FIXTURE_KEYS = (
  JSON.parse(fixture.typed_data) as {
    message: { keys: { pubkey: string; share: string }[] };
  }
).message.keys.map((key) => ({
  pubkey: key.pubkey,
  share: Number(key.share),
}));

/** A test encoder of the draft link, field by field. */
function encode(fields: Fields = {}): string {
  const keys = fields.keys ?? FIXTURE_KEYS;
  const network = fields.network ?? 0;
  const bytes = [
    fields.format ?? 1,
    network,
    ...(network === 1 ? bytesOf(fields.salt ?? `0x${"11".repeat(32)}`) : []),
    ...bytesOf(fields.account ?? fixture.account),
    ...(fields.authVersion ?? leb128(3n)),
    ...(fields.refBlockNumber ?? leb128(21_500_123n)),
    ...bytesOf(
      fields.refBlockHash ??
        "0x20b53acf0daefc8c6ad68c861fb3b543ca541abd101abc1edfcbf6606b838ef4"
    ),
    fields.n ?? keys.length,
    ...[((fields.mine ?? 0b10) >> 8) & 0xff, (fields.mine ?? 0b10) & 0xff],
    ...keys.flatMap((key) => [
      ...bytesOf(key.pubkey),
      (key.share >> 8) & 0xff,
      key.share & 0xff,
    ]),
    ...(fields.extra ?? []),
  ];
  const cut = fields.cut ?? 0;
  return Buffer.from(bytes.slice(0, bytes.length - cut)).toString("base64url");
}

describe("decodeDraftLink", () => {
  it("rebuilds the fixture's typed data byte for byte", () => {
    const draft = decodeDraftLink(`#${FRAGMENT}`);
    expect(draft).not.toBeNull();
    expect(draft!.typedDataJson).toBe(fixture.typed_data);
    expect(draft).toMatchObject({
      network: "mainnet",
      salt: MAINNET_SALT,
      account: fixture.account,
      authVersion: 3n,
      keys: [
        { pubkey: FIXTURE_KEYS[0]!.pubkey, share: 5000, mine: false },
        { pubkey: fixture.this_key, share: 5000, mine: true },
      ],
    });
  });

  it("gives the validator's digest, and a signature that recovers to the account", async () => {
    const typed = JSON.parse(
      decodeDraftLink(FRAGMENT)!.typedDataJson
    ) as GrantTypedData;
    expect(grantDigest(typed)).toBe(fixture.digest);
    expect(hashTypedData(toSignableTypedData(typed))).toBe(fixture.digest);
    const signer = await recoverTypedDataAddress({
      ...toSignableTypedData(typed),
      signature: fixture.signature as Hex,
    });
    expect(signer.toLowerCase()).toBe(fixture.account);
    expect(
      checkTypedData(typed, {
        account: fixture.account,
        network: "mainnet",
        sessionKeys: [fixture.this_key],
      })
    ).toEqual([]);
  });

  it("matches this test's encoder, field for field", () => {
    expect(encode()).toBe(FRAGMENT);
  });

  it("reads a test network's salt", () => {
    const salt = `0x${"ab".repeat(32)}`;
    const draft = decodeDraftLink(encode({ network: 1, salt }))!;
    expect(draft.network).toBe("test");
    expect(draft.salt).toBe(salt);
    expect(JSON.parse(draft.typedDataJson).domain.salt).toBe(salt);
  });

  it("refuses a test network link that carries the mainnet salt", () => {
    // The validator writes the mainnet salt only as network 0; signed, such
    // a link's grant would count on mainnet under a test label.
    expect(
      decodeDraftLink(encode({ network: 1, salt: MAINNET_SALT }))
    ).toBeNull();
  });

  it("reads a stop: no keys", () => {
    const draft = decodeDraftLink(encode({ keys: [], mine: 0 }))!;
    expect(draft.keys).toEqual([]);
    const typed = JSON.parse(draft.typedDataJson) as GrantTypedData;
    expect(typed.message.keys).toEqual([]);
    expect(
      checkTypedData(typed, {
        account: fixture.account,
        network: "mainnet",
        sessionKeys: [],
      })
    ).toEqual([]);
    expect(grantDigest(typed)).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("reads 16 keys and the largest numbers", () => {
    const keys = Array.from({ length: 16 }, (_, index) => ({
      pubkey: `0x${index.toString(16).padStart(2, "0").repeat(48)}`,
      share: 625,
    }));
    const draft = decodeDraftLink(
      encode({
        keys,
        mine: 0x8000,
        authVersion: leb128((1n << 64n) - 1n),
        refBlockNumber: leb128(0n),
      })
    )!;
    expect(draft.keys).toHaveLength(16);
    expect(draft.keys[15]!.mine).toBe(true);
    expect(draft.authVersion).toBe((1n << 64n) - 1n);
  });

  it.each([
    ["an empty fragment", ""],
    ["no fragment", "#"],
    ["a truncated link", encode({ cut: 1 })],
    ["a link cut inside a key", encode({ cut: 30 })],
    ["an extra byte", encode({ extra: [0] })],
    ["another format", encode({ format: 2 })],
    ["another network", encode({ network: 2 })],
    [
      "a number with a spare zero group",
      encode({ authVersion: Uint8Array.from([0x83, 0x00]) }),
    ],
    [
      "a number over 10 bytes",
      encode({
        refBlockNumber: Uint8Array.from([...Array(10).fill(0x80), 0x01]),
      }),
    ],
    [
      "a number past 2^64",
      encode({ authVersion: Uint8Array.from([...Array(9).fill(0xff), 0x02]) }),
    ],
    ["more than 16 keys", encode({ n: 17 })],
    ["a marked key past n", encode({ mine: 0b100 })],
    ["a marked key in a stop", encode({ keys: [], mine: 1 })],
    [
      "a share of 0",
      encode({ keys: [{ pubkey: fixture.this_key, share: 0 }], mine: 1 }),
    ],
    [
      "a share past 10,000",
      encode({ keys: [{ pubkey: fixture.this_key, share: 10_001 }], mine: 1 }),
    ],
    ["padding", `${FRAGMENT}==`],
    ["standard base64", FRAGMENT.replaceAll("-", "+").replaceAll("_", "/")],
    ["a character outside base64url", `${FRAGMENT.slice(0, -1)}.`],
    [
      "spare bits in the last character",
      withSpareBit(
        encode({ keys: [{ pubkey: fixture.this_key, share: 5000 }], mine: 1 })
      ),
    ],
    ["percent-encoding", `${FRAGMENT.slice(0, 10)}%41${FRAGMENT.slice(10)}`],
  ])("refuses %s", (_name, fragment) => {
    expect(decodeDraftLink(fragment)).toBeNull();
  });
});
