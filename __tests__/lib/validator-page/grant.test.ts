/** @jest-environment node */
import { hashTypedData, recoverTypedDataAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  GrantParseError,
  isValidatorSignature,
  MAX_GRANT_BYTES,
  parseValidatorGrant,
} from "@/lib/validator-page/grant";
import { grantFixture } from "./grantFixture";

const parse = (value: unknown) => parseValidatorGrant(JSON.stringify(value));

describe("validator authorization boundary", () => {
  it("accepts the export's decimal strings without losing uint64 precision", () => {
    const data = grantFixture();
    data.message.authVersion = "18446744073709551615";
    expect(parse(data).message.authVersion).toBe(18446744073709551615n);
    expect(parse(data).message.keys[0]?.share).toBe(10000);
  });

  it("preserves the EIP-712 digest across decimal-string parsing and signing", async () => {
    // Well-known synthetic test account, never funded or used by this feature.
    const account = privateKeyToAccount(`0x${"01".repeat(32)}`);
    const data = grantFixture();
    data.message.account = account.address;
    const grant = parse(data);
    const signature = await account.signTypedData(grant);
    expect(isValidatorSignature(signature)).toBe(true);
    expect(await recoverTypedDataAddress({ ...grant, signature })).toBe(
      account.address
    );
    const stringNumbers = {
      ...grant,
      message: {
        ...grant.message,
        authVersion: data.message.authVersion,
        refBlockNumber: data.message.refBlockNumber,
      },
    };
    expect(hashTypedData(stringNumbers)).toBe(hashTypedData(grant));
  });

  it.each([
    ["chainId in domain", ["domain", "chainId"], 1],
    [
      "contract in domain",
      ["domain", "verifyingContract"],
      "0x0000000000000000000000000000000000000001",
    ],
    ["different name", ["domain", "name"], "Permit2"],
    ["different version", ["domain", "version"], "2"],
    ["different network", ["domain", "salt"], `0x${"13".repeat(32)}`],
    ["different purpose", ["message", "purpose"], "Move funds"],
    ["different primary type", ["primaryType"], "Permit"],
    ["extra type", ["types", "Permit"], []],
    ["changed type", ["types", "ValidatorGrant", "2", "type"], "uint256"],
    ["unknown message field", ["message", "spender"], "0x01"],
    ["unknown top field", ["privateKey"], "never accepted"],
    ["invalid account", ["message", "account"], "0x123"],
    ["short key", ["message", "keys", "0", "pubkey"], "0x12"],
    ["zero share", ["message", "keys", "0", "share"], "0"],
    ["large share", ["message", "keys", "0", "share"], "10001"],
    ["uint64 overflow", ["message", "authVersion"], "18446744073709551616"],
    ["unsafe JSON number", ["message", "authVersion"], 9007199254740992],
    ["partial number", ["message", "refBlockNumber"], "26354747abc"],
    ["negative number", ["message", "authVersion"], "-1"],
  ] as const)("rejects %s", (_name, path, value) => {
    const data = grantFixture();
    let target: object = data;
    for (const key of path.slice(0, -1))
      target = Reflect.get(target, key) as object;
    Reflect.set(target, path[path.length - 1]!, value);
    expect(() => parse(data)).toThrow(GrantParseError);
  });

  it("rejects missing fields, duplicate keys, and excessive key lists", () => {
    const missing = grantFixture();
    Reflect.deleteProperty(missing.message, "refBlockHash");
    expect(() => parse(missing)).toThrow(GrantParseError);
    const duplicate = grantFixture();
    duplicate.message.keys.push(...duplicate.message.keys);
    expect(() => parse(duplicate)).toThrow(GrantParseError);
    const tooMany = grantFixture();
    tooMany.message.keys = Array.from(
      { length: 17 },
      () => grantFixture().message.keys[0]!
    );
    expect(() => parse(tooMany)).toThrow(GrantParseError);
  });

  it("accepts a revocation only as an explicitly empty key list", () => {
    const data = grantFixture();
    data.message.keys = [];
    expect(parse(data).message.keys).toEqual([]);
  });

  it("rejects malformed JSON and bounded file input", () => {
    expect(() => parseValidatorGrant("{")).toThrow(GrantParseError);
    expect(() => parseValidatorGrant(" ".repeat(MAX_GRANT_BYTES + 1))).toThrow(
      "tooLarge"
    );
    expect(() => parse(null)).toThrow(GrantParseError);
  });
});

it("rejects noncanonical signatures before wallet recovery", () => {
  const scalar = "01".repeat(32);
  expect(isValidatorSignature(`0x${scalar}${scalar}1b`)).toBe(true);
  expect(isValidatorSignature(`0x${scalar}${scalar}1c`)).toBe(true);
  for (const v of ["00", "01", "1d", "25"]) {
    expect(isValidatorSignature(`0x${scalar}${scalar}${v}`)).toBe(false);
  }
  expect(isValidatorSignature(`0x${"00".repeat(32)}${scalar}1b`)).toBe(false);
  expect(isValidatorSignature(`0x${scalar}${"00".repeat(32)}1b`)).toBe(false);
  expect(isValidatorSignature(`0x${"ff".repeat(32)}${scalar}1b`)).toBe(false);
  expect(isValidatorSignature(`0x${scalar}${"ff".repeat(32)}1b`)).toBe(false);
  const halfOrder =
    0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n;
  expect(
    isValidatorSignature(
      `0x${scalar}${halfOrder.toString(16).padStart(64, "0")}1b`
    )
  ).toBe(true);
  expect(
    isValidatorSignature(
      `0x${scalar}${(halfOrder + 1n).toString(16).padStart(64, "0")}1b`
    )
  ).toBe(false);
  expect(isValidatorSignature("0x12")).toBe(false);
});
