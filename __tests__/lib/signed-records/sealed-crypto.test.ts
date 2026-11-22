/**
 * @jest-environment node
 */
import {
  encodeKeysDocument,
  fromBase64Url,
  hpkeSealBase,
  isSealSupported,
  openSealedItems,
  SealedClass,
  sealItems,
  toBase64Url,
  wrapSenderKey,
} from "@/lib/signed-records/sealed-crypto";
import {
  bytesToHex,
  hexToBytes,
  RECORD_VECTORS,
  sealedBodyBytes,
} from "./signed-records-test-utils";

const rfc = RECORD_VECTORS.rfc9180A1;
const inputs = RECORD_VECTORS.inputs;
const PV_WAVE = RECORD_VECTORS.sealedSettings.event.wave;
const senderKey = hexToBytes(inputs.senderKey);

describe("HPKE base mode (RFC 9180 A.1.1)", () => {
  it("reproduces the RFC ciphertext with WebCrypto", async () => {
    const { enc, ct } = await hpkeSealBase({
      recipientPublicKey: hexToBytes(rfc.pkRm),
      info: hexToBytes(rfc.info),
      aad: hexToBytes(rfc.aad),
      plaintext: hexToBytes(rfc.pt),
      ephemeralPrivateKey: hexToBytes(rfc.skEm),
    });
    expect(bytesToHex(enc)).toBe(rfc.pkEm);
    expect(bytesToHex(ct)).toBe(rfc.ct);
  });

  it("detects WebCrypto X25519", async () => {
    await expect(isSealSupported()).resolves.toBe(true);
  });
});

describe("sealed items", () => {
  it("reproduces the backend vector bytes and opens them", async () => {
    const c = await sealItems({
      wave: PV_WAVE,
      cls: SealedClass.PROVIDER,
      gen: 1,
      deviceKey: inputs.deviceKey,
      senderKey,
      items: [{ t: "mute", k: inputs.target, b: {} }],
      fixedNonceForTests: hexToBytes(inputs.sealNonce),
    });
    expect(bytesToHex(c)).toBe(RECORD_VECTORS.sealedSettings.c);
    expect(c).toEqual(sealedBodyBytes(RECORD_VECTORS.sealedSettings.event));
    await expect(
      openSealedItems({ wave: PV_WAVE, bytes: c, senderKey })
    ).resolves.toEqual({
      cls: 1,
      gen: 1,
      deviceKey: inputs.deviceKey,
      items: [{ t: "mute", k: inputs.target, b: {} }],
    });
  });

  it("refuses another key or stream, and malformed items", async () => {
    const c = sealedBodyBytes(RECORD_VECTORS.sealedSettings.event);
    await expect(
      openSealedItems({
        wave: PV_WAVE,
        bytes: c,
        senderKey: new Uint8Array(32),
      })
    ).rejects.toThrow("do not open");
    await expect(
      openSealedItems({ wave: `${PV_WAVE}0`, bytes: c, senderKey })
    ).rejects.toThrow("do not open");
    await expect(
      sealItems({
        wave: PV_WAVE,
        cls: SealedClass.PROVIDER,
        gen: 1,
        deviceKey: inputs.deviceKey,
        senderKey,
        items: [{ t: "Bad", k: "x", b: {} }],
      })
    ).rejects.toThrow("Sealed item");
    await expect(
      sealItems({
        wave: PV_WAVE,
        cls: 9,
        gen: 1,
        deviceKey: inputs.deviceKey,
        senderKey,
        items: [{ t: "mute", k: "x", b: null }],
      })
    ).rejects.toThrow("Unknown sealed class");
  });

  it("checks items as the backend does: types first, well-formed keys", async () => {
    const seal = (item: unknown) =>
      sealItems({
        wave: PV_WAVE,
        cls: SealedClass.PROVIDER,
        gen: 1,
        deviceKey: inputs.deviceKey,
        senderKey,
        items: [item as never],
      });
    // A number type would pass the pattern once coerced to "123".
    await expect(seal({ t: 123, k: "x", b: {} })).rejects.toThrow(
      "Sealed item"
    );
    await expect(seal({ t: "mute", k: 7, b: {} })).rejects.toThrow(
      "Sealed item"
    );
    await expect(seal({ t: "mute", k: "\uD800", b: {} })).rejects.toThrow(
      "Sealed item"
    );
    await expect(seal({ t: "mute", k: "x", b: [] })).rejects.toThrow(
      "Sealed item"
    );
  });

  it("takes a fixed nonce only of 12 bytes", async () => {
    await expect(
      sealItems({
        wave: PV_WAVE,
        cls: SealedClass.PROVIDER,
        gen: 1,
        deviceKey: inputs.deviceKey,
        senderKey,
        items: [{ t: "mute", k: "x", b: null }],
        fixedNonceForTests: new Uint8Array(11),
      })
    ).rejects.toThrow("12 bytes");
  });

  it("pads to the buckets with a random nonce", async () => {
    const seal = (size: number) =>
      sealItems({
        wave: PV_WAVE,
        cls: SealedClass.OWN,
        gen: 2,
        deviceKey: inputs.deviceKey,
        senderKey,
        items: [{ t: "bookmark", k: "d", b: { note: "a".repeat(size) } }],
      });
    const first = await seal(10);
    const second = await seal(10);
    expect(first.length).toBe(50 + 256 + 16);
    expect(first).not.toEqual(second);
    expect((await seal(3000)).length).toBe(50 + 4096 + 16);
    await expect(seal(40_000)).rejects.toThrow("too large");
  });
});

describe("keys documents", () => {
  it("reproduces the backend wrap and keys document", async () => {
    const wrap = await wrapSenderKey({
      wave: PV_WAVE,
      cls: SealedClass.PROVIDER,
      gen: 1,
      from: inputs.deviceKey,
      recipient: {
        id: inputs.providerKeyId,
        publicKey: hexToBytes(inputs.providerPublicKey),
      },
      senderKey,
      ephemeralPrivateKey: hexToBytes(inputs.wrapEphemeralPrivateKey),
    });
    expect(bytesToHex(fromBase64Url(wrap.enc))).toBe(RECORD_VECTORS.keys.enc);
    expect(bytesToHex(fromBase64Url(wrap.ct))).toBe(RECORD_VECTORS.keys.ct);
    const bytes = encodeKeysDocument({
      v: 1,
      dev: inputs.deviceKey,
      box: null,
      wraps: [wrap],
    });
    expect(bytes).toEqual(sealedBodyBytes(RECORD_VECTORS.keys.event));
  });

  it("round-trips base64url like Node", () => {
    const bytes = new Uint8Array([0, 251, 255, 62, 63, 1]);
    expect(toBase64Url(bytes)).toBe(Buffer.from(bytes).toString("base64url"));
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
  });
});
