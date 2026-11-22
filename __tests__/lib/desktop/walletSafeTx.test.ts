import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { toFunctionSelector } from "viem";
import {
  fitsWalletRequestFragment,
  parseWalletRequest,
  walletBridgeSignsSafeTx,
} from "@/lib/desktop/wallet-forwarding";
import { MAX_TYPED_DATA_CHARS } from "@/lib/desktop/wallet-forwarding/shared";
import { decodeMultiSend } from "@/lib/desktop/wallet-safe-tx/check";
import {
  governanceRules,
  SINGLE_CALL_ONLY,
} from "@/lib/desktop/wallet-safe-tx/governance-rules";
import {
  canonicalSafeTxJson,
  walletSafeTxHash,
} from "@/lib/desktop/wallet-safe-tx/hash";
import { SAFE_TX_PINS } from "@/lib/desktop/wallet-safe-tx/pins";
import { describeWalletRequest } from "@/lib/desktop/walletRequestDescribe";
import {
  buildSafeTxVectors,
  registrationBatch,
  SAFE_TX_SIGNER,
  type SafeTxVector,
} from "@/__tests__/fixtures/desktop-wallet-safe-tx/vectors";

const FIXTURES = path.join(__dirname, "../../fixtures/desktop-wallet-safe-tx");
const TABLE_FIXTURE = path.join(FIXTURES, "website-safetx.json");
const VECTORS_FIXTURE = path.join(FIXTURES, "website-safetx-vectors.json");
/** Set to rewrite the JSON fixtures from the sources (then review the diff). */
const UPDATE = process.env["UPDATE_DESKTOP_TX_FIXTURES"] === "1";

function readFixture(file: string, expected: unknown): unknown {
  if (UPDATE) writeFileSync(file, `${JSON.stringify(expected, null, 2)}\n`);
  return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

const ORIGIN = "http://localhost:6529";

function describeVector(vector: SafeTxVector) {
  const parsed = parseWalletRequest(
    {
      method: "eth_signTypedData_v4",
      params: [SAFE_TX_SIGNER, vector.payload],
      address: SAFE_TX_SIGNER,
      chainId: vector.chainId,
    },
    [1, 11_155_111]
  );
  if (!parsed.ok) throw new Error(`${vector.name}: ${parsed.problem}`);
  return describeWalletRequest(parsed.value, ORIGIN);
}

const vectors = buildSafeTxVectors();

describe("SafeTx vectors", () => {
  it.each(vectors.map((vector) => [vector.name, vector] as const))(
    "%s",
    (_name, vector) => {
      const described = describeVector(vector);
      if (vector.expect.ok) {
        expect(described.ok).toBe(true);
        if (!described.ok || described.value.kind !== "safeTx") {
          throw new Error("not a Safe transaction");
        }
        const { safeTx } = described.value;
        expect(safeTx.risk).toBe(vector.expect.risk);
        expect(safeTx.calls.map((call) => call.ruleId)).toEqual(
          vector.expect.calls
        );
      } else {
        expect(described).toEqual({
          ok: false,
          refusal: vector.expect.problem,
        });
      }
    }
  );

  it("has unique names and accepts every governance call", () => {
    const names = vectors.map((vector) => vector.name);
    expect(new Set(names).size).toBe(names.length);
    const accepted = new Set(
      vectors.flatMap((vector) => (vector.expect.ok ? vector.expect.calls : []))
    );
    for (const rule of governanceRules(11_155_111, "0x00")) {
      expect(accepted).toContain(rule.id);
    }
  });

  it("are requests forwarding accepts (shape and size)", () => {
    for (const vector of vectors) {
      expect(() => describeVector(vector)).not.toThrow();
    }
  });

  it("matches the shared JSON vectors", () => {
    const shared = { signer: SAFE_TX_SIGNER, vectors };
    expect(readFixture(VECTORS_FIXTURE, shared)).toEqual(
      JSON.parse(JSON.stringify(shared))
    );
  });
});

describe("SafeTx table", () => {
  it("pins the Sepolia test Safe, its two registries and MultiSendCallOnly", () => {
    expect(SAFE_TX_PINS).toEqual([
      {
        chainId: 11_155_111,
        safe: "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68",
        multiSendCallOnly: "0x9641d764fc13c8b624c04430c7356c1c7c8102e2",
        registries: [
          {
            address: "0x0e289576c7565d29018134517309668946ffc912",
            name: "provenanceTest",
          },
          {
            address: "0xee91c45a1893fbb45ce8eea170ef05d8d85bb850",
            name: "museumCatalog",
          },
        ],
      },
    ]);
  });

  it("uses the registry interface's selectors (v1.0.0-rc.1)", () => {
    const selectors = Object.fromEntries(
      governanceRules(11_155_111, "0x00").map((rule) => [
        rule.id,
        rule.selector,
      ])
    );
    expect(selectors).toEqual({
      "governance.registerCanonicalization": "0xe2fb0b20",
      "governance.registerRecordType": "0x4725e130",
      "governance.registerSchema": "0xdad47848",
      "governance.setPublisher": "0x618bb079",
      "governance.deleteVersion": "0x9c43494f",
      "governance.deleteVersions": "0x0e9e6c6e",
      "governance.deleteSubject": "0xcb1efbf1",
      "governance.freeze": "0x62a5af3b",
      "governance.declareSuccessor": "0x731fa208",
      "governance.transferOwnership": "0xf2fde38b",
      "governance.acceptOwnership": "0x79ba5097",
    });
    for (const rule of governanceRules(11_155_111, "0x00")) {
      expect(rule.selector).toBe(toFunctionSelector(rule.signature!));
    }
    expect(SINGLE_CALL_ONLY).toHaveLength(7);
  });

  it("matches the shared JSON table and hash", () => {
    const fixture = {
      sha256: walletSafeTxHash(),
      canonical: JSON.parse(canonicalSafeTxJson()) as unknown,
    };
    expect(readFixture(TABLE_FIXTURE, fixture)).toEqual(fixture);
    expect(walletSafeTxHash()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("asks only a 6529 Desktop with the same table to sign", () => {
    const methods = ["personal_sign", "eth_signTypedData_v4"];
    expect(
      walletBridgeSignsSafeTx({
        version: 1,
        methods,
        safeTx: walletSafeTxHash(),
      })
    ).toBe(true);
    for (const value of [
      { version: 1, methods },
      { version: 1, methods, safeTx: "0".repeat(64) },
      { version: 1, methods, safeTx: walletSafeTxHash().toUpperCase() },
      { version: 1, methods: ["personal_sign"], safeTx: walletSafeTxHash() },
      { version: 2, methods, safeTx: walletSafeTxHash() },
    ]) {
      expect(walletBridgeSignsSafeTx(value)).toBe(false);
    }
  });
});

describe("decodeMultiSend", () => {
  it("reads every packed call and refuses leftovers", () => {
    const data = registrationBatch(2, 8);
    const calls = decodeMultiSend(data);
    expect(calls).toHaveLength(2);
    expect(calls?.[0]).toMatchObject({
      operation: 0,
      to: "0x0e289576c7565d29018134517309668946ffc912",
      value: 0n,
    });
    expect(decodeMultiSend(`${data}00` as `0x${string}`)).toBeNull();
    expect(decodeMultiSend("0x8d80ff0a")).toBeNull();
  });
});

describe("SafeTx size", () => {
  /** The typed data for a batch of `count` registrations. */
  const typedData = (count: number, literalLength: number) =>
    JSON.stringify({
      domain: {
        chainId: 11_155_111,
        verifyingContract: "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68",
      },
      message: {
        to: "0x9641d764fc13c8B624c04430C7356C1C7C8102e2",
        value: "0",
        data: registrationBatch(count, literalLength),
        operation: 1,
        safeTxGas: "0",
        baseGas: "0",
        gasPrice: "0",
        gasToken: "0x0000000000000000000000000000000000000000",
        refundReceiver: "0x0000000000000000000000000000000000000000",
        nonce: "9007199254740991",
      },
      primaryType: "SafeTx",
      types: {
        EIP712Domain: [
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        SafeTx: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "operation", type: "uint8" },
          { name: "safeTxGas", type: "uint256" },
          { name: "baseGas", type: "uint256" },
          { name: "gasPrice", type: "uint256" },
          { name: "gasToken", type: "address" },
          { name: "refundReceiver", type: "address" },
          { name: "nonce", type: "uint256" },
        ],
      },
    });
  const fits = (count: number, literalLength: number) => {
    const payload = typedData(count, literalLength);
    return (
      payload.length <= MAX_TYPED_DATA_CHARS &&
      fitsWalletRequestFragment({
        method: "eth_signTypedData_v4",
        params: [SAFE_TX_SIGNER, payload],
        address: SAFE_TX_SIGNER,
        chainId: 11_155_111,
      })
    );
  };

  it("fits 16 schema registrations with short literals and 13 with the longest", () => {
    // Literal 24 characters, 64-byte CID: a full batch of 16 fits.
    expect(fits(16, 24)).toBe(true);
    // Literal 128 characters (the most a literal may have), 64-byte CID.
    expect(fits(13, 128)).toBe(true);
    expect(fits(14, 128)).toBe(false);
  });
});
