import fixture from "@/__tests__/fixtures/app-wallet-encrypted-payloads.json";
import {
  getAppWalletEncryptionVersion,
  isAppWalletEncryptedEnvelope,
} from "@/components/app-wallets/app-wallet-envelope";

type EnvelopeFields = Record<string, unknown> & {
  kdf: Record<string, unknown>;
};

const baseEnvelope = (): EnvelopeFields =>
  JSON.parse(fixture.v2.address.envelope) as EnvelopeFields;

// The shape check used to measure hex fields with Buffer. This mirrors that
// original check so the Buffer-free version can be compared case by case.
function bufferBasedShapeCheck(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as EnvelopeFields;
    const isHex = (field: unknown): field is string =>
      typeof field === "string" && /^[0-9a-f]+$/i.test(field);
    const byteLength = (field: string) => Buffer.from(field, "hex").length;
    const iterations = parsed.kdf?.["iterations"];
    return (
      parsed["version"] === 2 &&
      parsed["algorithm"] === "aes-256-gcm" &&
      parsed.kdf?.["name"] === "pbkdf2" &&
      parsed.kdf["hash"] === "sha256" &&
      typeof iterations === "number" &&
      Number.isSafeInteger(iterations) &&
      iterations >= 100001 &&
      iterations <= 600000 &&
      parsed.kdf["key_length"] === 32 &&
      isHex(parsed.kdf["salt"]) &&
      byteLength(parsed.kdf["salt"]) >= 16 &&
      isHex(parsed["iv"]) &&
      byteLength(parsed["iv"]) === 12 &&
      isHex(parsed["auth_tag"]) &&
      byteLength(parsed["auth_tag"]) === 16 &&
      isHex(parsed["ciphertext"])
    );
  } catch {
    return false;
  }
}

const hexOfLength = (length: number) => "a".repeat(length);

const mutations: Array<[string, (envelope: EnvelopeFields) => void]> = [
  ["unchanged", () => undefined],
  ["iv of 23 hex chars", (e) => (e["iv"] = hexOfLength(23))],
  ["iv of 25 hex chars", (e) => (e["iv"] = hexOfLength(25))],
  ["iv of 26 hex chars", (e) => (e["iv"] = hexOfLength(26))],
  ["auth tag of 31 hex chars", (e) => (e["auth_tag"] = hexOfLength(31))],
  ["auth tag of 33 hex chars", (e) => (e["auth_tag"] = hexOfLength(33))],
  ["salt of 31 hex chars", (e) => (e.kdf["salt"] = hexOfLength(31))],
  ["salt of 33 hex chars", (e) => (e.kdf["salt"] = hexOfLength(33))],
  ["non-hex iv", (e) => (e["iv"] = "z".repeat(24))],
  ["empty ciphertext", (e) => (e["ciphertext"] = "")],
  ["odd ciphertext", (e) => (e["ciphertext"] = hexOfLength(7))],
  ["legacy iterations", (e) => (e.kdf["iterations"] = 100000)],
  ["oldest v2 iterations", (e) => (e.kdf["iterations"] = 100001)],
  ["too many iterations", (e) => (e.kdf["iterations"] = 600001)],
  ["fractional iterations", (e) => (e.kdf["iterations"] = 200000.5)],
  ["wrong key length", (e) => (e.kdf["key_length"] = 16)],
  ["wrong hash", (e) => (e.kdf["hash"] = "sha512")],
  ["missing kdf", (e) => delete (e as Partial<EnvelopeFields>).kdf],
  ["wrong algorithm", (e) => (e["algorithm"] = "aes-128-gcm")],
  ["wrong version", (e) => (e["version"] = 3)],
];

describe("app-wallet envelope shape check", () => {
  it.each(mutations)(
    "matches the original Buffer-based check (%s)",
    (_name, mutate) => {
      const envelope = baseEnvelope();
      mutate(envelope);
      const serialized = JSON.stringify(envelope);

      expect(isAppWalletEncryptedEnvelope(serialized)).toBe(
        bufferBasedShapeCheck(serialized)
      );
    }
  );

  it.each(["", "null", "5", "not json", fixture.v1.address.payload])(
    "rejects non-envelope payloads (%s)",
    (value) => {
      expect(isAppWalletEncryptedEnvelope(value)).toBe(false);
      expect(bufferBasedShapeCheck(value)).toBe(false);
    }
  );

  it("recognises every stored fixture by version", () => {
    for (const { envelope } of Object.values(fixture.v2)) {
      expect(isAppWalletEncryptedEnvelope(envelope)).toBe(true);
      expect(getAppWalletEncryptionVersion(envelope)).toBe(2);
    }
    for (const { payload } of Object.values(fixture.v1)) {
      expect(isAppWalletEncryptedEnvelope(payload)).toBe(false);
      expect(getAppWalletEncryptionVersion(payload)).toBe(1);
    }
    expect(getAppWalletEncryptionVersion("")).toBeNull();
    expect(getAppWalletEncryptionVersion(undefined)).toBeNull();
  });
});
