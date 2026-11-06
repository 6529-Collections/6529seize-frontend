/** @jest-environment node */
import { hashTypedData, recoverTypedDataAddress, type Hex } from "viem";

import {
  keyCode,
  sharePercents,
  shortAddress,
  withLegacyRecoveryByte,
} from "@/lib/validator-page/authorize/display";
import {
  checkTypedData,
  grantDigest,
  toSignableTypedData,
  type GrantTypedData,
} from "@/lib/validator-page/authorize/typedData";

import fixture from "./fixture-grant.json";

// Made by the validator's own Rust code (keys crate, eip712.rs): the typed
// data it drafts, its EIP-712 digest and a signature by a test wallet.
const OPTIONS = {
  account: fixture.account,
  network: fixture.network,
  sessionKeys: [fixture.this_key],
};

type Mutable = {
  domain: Record<string, unknown>;
  types: Record<string, { name: string; type: string }[]>;
  primaryType: unknown;
  message: Record<string, unknown> & {
    keys: Record<string, unknown>[];
  };
};

function grant(): Mutable {
  return JSON.parse(fixture.typed_data) as Mutable;
}

describe("the shared grant fixture", () => {
  it("is exactly a 6529 Validator authorization", () => {
    expect(checkTypedData(grant(), OPTIONS)).toEqual([]);
  });

  it("hashes to the validator's digest", () => {
    const typed = grant() as unknown as GrantTypedData;
    expect(grantDigest(typed)).toBe(fixture.digest);
    expect(hashTypedData(toSignableTypedData(typed))).toBe(fixture.digest);
  });

  it("has a signature that recovers to its account", async () => {
    const typed = grant() as unknown as GrantTypedData;
    const signer = await recoverTypedDataAddress({
      ...toSignableTypedData(typed),
      signature: fixture.signature as Hex,
    });
    expect(signer.toLowerCase()).toBe(fixture.account);
  });

  it("accepts the account in any case and the mainnet salt only on mainnet", () => {
    expect(
      checkTypedData(grant(), {
        ...OPTIONS,
        account: fixture.account.toUpperCase().replace("0X", "0x"),
      })
    ).toEqual([]);
    const otherSalt = grant();
    otherSalt.domain["salt"] = `0x${"11".repeat(32)}`;
    expect(checkTypedData(otherSalt, OPTIONS)).toEqual([
      "Its domain salt isn't the mainnet one.",
    ]);
    expect(
      checkTypedData(otherSalt, { ...OPTIONS, network: "testnet" })
    ).toEqual([]);
  });
});

describe("checkTypedData refuses each single change", () => {
  const cases: [string, (typed: Mutable) => void][] = [
    ["another primary type", (t) => (t.primaryType = "ValidatorKey")],
    ["a chainId in the domain", (t) => (t.domain["chainId"] = 1)],
    ["no salt", (t) => delete t.domain["salt"]],
    ["another domain name", (t) => (t.domain["name"] = "6529 validator")],
    ["another domain version", (t) => (t.domain["version"] = "2")],
    ["a short salt", (t) => (t.domain["salt"] = "0x1234")],
    [
      "another domain type",
      (t) => (t.types["EIP712Domain"]![2]!.type = "bytes"),
    ],
    [
      "fields of the grant in another order",
      (t) => t.types["ValidatorGrant"]!.reverse(),
    ],
    [
      "a share wider than uint16",
      (t) => (t.types["ValidatorKey"]![1]!.type = "uint256"),
    ],
    [
      "another type",
      (t) => (t.types["Extra"] = [{ name: "x", type: "string" }]),
    ],
    [
      "another purpose",
      (t) => (t.message["purpose"] = `${String(t.message["purpose"])} `),
    ],
    ["another account", (t) => (t.message["account"] = `0x${"12".repeat(20)}`)],
    ["another message field", (t) => (t.message["note"] = "hi")],
    [
      "an authVersion that isn't a number",
      (t) => (t.message["authVersion"] = "3a"),
    ],
    [
      "a block number past uint64",
      (t) => (t.message["refBlockNumber"] = "18446744073709551616"),
    ],
    ["a short block hash", (t) => (t.message["refBlockHash"] = "0x20b5")],
    ["no keys", (t) => (t.message.keys = [])],
    [
      "a key that isn't 48 bytes",
      (t) => (t.message.keys[0]!["pubkey"] = "0x1234"),
    ],
    ["a share of 0", (t) => (t.message.keys[0]!["share"] = "0")],
    ["a share past 10,000", (t) => (t.message.keys[0]!["share"] = "10001")],
    ["a share that isn't whole", (t) => (t.message.keys[0]!["share"] = "50.5")],
    [
      "this validator's key left out",
      (t) => (t.message.keys = t.message.keys.slice(0, 1)),
    ],
  ];

  it.each(cases)("%s", (_name, change) => {
    const typed = grant();
    change(typed);
    expect(checkTypedData(typed, OPTIONS).length).toBeGreaterThan(0);
  });

  it("anything that isn't an object", () => {
    expect(checkTypedData(null, OPTIONS)).toEqual([
      "It isn't EIP-712 typed data.",
    ]);
    expect(checkTypedData("{}", OPTIONS).length).toBe(1);
  });

  it("a draft for another wallet than the connected one", () => {
    expect(
      checkTypedData(grant(), { ...OPTIONS, account: `0x${"ab".repeat(20)}` })
    ).toEqual(["It is for another account than the connected wallet."]);
  });
});

describe("display helpers", () => {
  it("shows a key by its code", () => {
    expect(keyCode(fixture.this_key)).toBe("9f3a2c71");
    expect(keyCode("0xABCDEF0123456789")).toBe("23456789");
  });

  it("shows shares as percents of their sum", () => {
    expect(sharePercents([5000, 5000])).toEqual(["50%", "50%"]);
    expect(sharePercents([10_000])).toEqual(["100%"]);
    expect(sharePercents([1, 1, 1])).toEqual(["33.33%", "33.33%", "33.33%"]);
    expect(sharePercents([2500, 7500])).toEqual(["25%", "75%"]);
  });

  it("shortens an address", () => {
    expect(shortAddress(fixture.account)).toBe("0xd580…2c77");
  });

  it("adds 27 to a recovery byte of 0 or 1 and leaves the rest", () => {
    const body = fixture.signature.slice(0, 130);
    expect(withLegacyRecoveryByte(`${body}00`)).toBe(`${body}1b`);
    expect(withLegacyRecoveryByte(`${body}01`)).toBe(`${body}1c`);
    expect(withLegacyRecoveryByte(`${body}1b`)).toBe(`${body}1b`);
    expect(withLegacyRecoveryByte(`${body}1c`)).toBe(`${body}1c`);
    expect(withLegacyRecoveryByte(fixture.signature)).toBe(fixture.signature);
    expect(withLegacyRecoveryByte("0x1234")).toBe("0x1234");
  });
});
