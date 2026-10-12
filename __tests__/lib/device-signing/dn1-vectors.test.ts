import { hashMessage, keccak256, stringToBytes } from "viem";
import {
  canonicalizeBody,
  canonicalJson,
} from "@/lib/device-signing/canonical-json";
import {
  signEventId,
  verifyEventIdSignature,
} from "@/lib/device-signing/ed25519";
import {
  buildDeviceGrantUrn,
  parseDeviceGrantMessage,
  renderDeviceGrantStatement,
} from "@/lib/device-signing/grant-message";
import { computeInterimEventId } from "@/lib/device-signing/interim-event";
import {
  buildVectorGrantMessage,
  importVectorPrivateKey,
  installNodeWebCrypto,
  VECTORS,
} from "./device-signing-test-utils";

describe("DN1 shared contract vectors", () => {
  beforeAll(installNodeWebCrypto);

  it("derives the interim domain salt", () => {
    expect(keccak256(stringToBytes("6529 Network pre-genesis interim 1"))).toBe(
      VECTORS.salt
    );
  });

  it("canonicalizes, hashes and sizes the POST body", () => {
    expect(canonicalJson(VECTORS.body)).toBe(VECTORS.canonicalBody);
    expect(canonicalizeBody(VECTORS.body)).toEqual({
      canonical: VECTORS.canonicalBody,
      bodyHash: VECTORS.bodyHash,
      bodySize: VECTORS.bodySize,
    });
  });

  it("drops undefined members exactly as the wire body does", () => {
    const withUndefined = { ...VECTORS.body, poll: undefined };
    expect(canonicalizeBody(withUndefined).canonical).toBe(
      VECTORS.canonicalBody
    );
  });

  it("hashes a missing body as 32 zero bytes of size 0", () => {
    expect(canonicalizeBody(null)).toEqual({
      canonical: null,
      bodyHash: VECTORS.tombstone.bodyHash,
      bodySize: 0,
    });
  });

  it("reproduces the grant id used as authRef", () => {
    expect(hashMessage("example grant message")).toBe(VECTORS.authRef);
  });

  it("reproduces both event ids", () => {
    expect(computeInterimEventId(VECTORS.event)).toBe(VECTORS.eventId);
    expect(computeInterimEventId(VECTORS.tombstone)).toBe(
      VECTORS.tombstoneEventId
    );
  });

  it("signs the event id deterministically and verifies it with the device key", async () => {
    const privateKey = await importVectorPrivateKey();
    await expect(signEventId(privateKey, VECTORS.eventId)).resolves.toBe(
      VECTORS.signature
    );
    await expect(
      verifyEventIdSignature({
        publicKeyHex: VECTORS.deviceKey,
        eventId: VECTORS.eventId,
        signatureHex: VECTORS.signature,
      })
    ).resolves.toBe(true);
    await expect(
      verifyEventIdSignature({
        publicKeyHex: VECTORS.deviceKey,
        eventId: VECTORS.tombstoneEventId,
        signatureHex: VECTORS.signature,
      })
    ).resolves.toBe(false);
  });

  it("renders the grant statement and resource", () => {
    const terms = {
      deviceKeyHex: VECTORS.deviceKey,
      scopes: ["post", "edit", "delete", "react"],
      expiresAtSeconds: VECTORS.grantExpiresAtSeconds,
    };
    expect(renderDeviceGrantStatement(terms)).toBe(VECTORS.grantStatement);
    expect(buildDeviceGrantUrn(terms)).toBe(VECTORS.grantResource);
  });

  it("parses the full grant SIWE message and reproduces its grant id", () => {
    const message = buildVectorGrantMessage();
    expect(hashMessage(message)).toBe(VECTORS.grantId);
    expect(parseDeviceGrantMessage(message)).toEqual({
      address: "0x1111111111111111111111111111111111111111",
      deviceKeyHex: VECTORS.deviceKey,
      scopes: ["post", "edit", "delete", "react"],
      expiresAtSeconds: VECTORS.grantExpiresAtSeconds,
    });
  });
});
