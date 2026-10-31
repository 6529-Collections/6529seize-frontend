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
  renderLegacyDeviceGrantStatement,
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

  it("reproduces backend-computed REACT and top-level POST event ids", () => {
    // Computed independently with ethers 6 over the same fields, so the
    // signed REACT body shape and empty refs are pinned across implementations.
    const reactOn = canonicalizeBody({ on: true, reaction: ":+1:" });
    expect(reactOn).toEqual({
      canonical: '{"on":true,"reaction":":+1:"}',
      bodyHash:
        "0xb4f2d00ed11f032283f010298cf872d11eb9d8060ce0b951a4b22fdfd8a45606",
      bodySize: 29,
    });
    const reactOff = canonicalizeBody({ on: false });
    expect(reactOff.bodyHash).toBe(
      "0xa79edd7964b9a4536b68d5f1f32408bd0d48a739e8f498375a60dcc61e71e955"
    );
    const react = {
      ...VECTORS.event,
      kind: 4,
      refs: [...VECTORS.tombstone.refs],
    };
    expect(
      computeInterimEventId({
        ...react,
        seq: 1760000000002,
        bodyHash: reactOn.bodyHash,
        bodySize: reactOn.bodySize,
      })
    ).toBe(
      "0xb66822b7d5148d6c5e2dd3b8adaebbd0594c9b20663ab6d09f12b617e6c3f76f"
    );
    expect(
      computeInterimEventId({
        ...react,
        seq: 1760000000003,
        bodyHash: reactOff.bodyHash,
        bodySize: reactOff.bodySize,
      })
    ).toBe(
      "0x26629d44d77aa972dc2bb180633c4e98359d838c3da93fc677e07e9e87163ea8"
    );
    expect(
      computeInterimEventId({ ...VECTORS.event, refs: [], seq: 1760000000004 })
    ).toBe(
      "0x52ce316e1fe8f4280d424445944f276d51524288f758cfe5d2170d2a954c77e6"
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

  it("renders the current and legacy grant statements and the resource", () => {
    const terms = {
      deviceKeyHex: VECTORS.deviceKey,
      scopes: ["post", "edit", "delete", "react"],
      expiresAtSeconds: VECTORS.grantExpiresAtSeconds,
    };
    expect(renderDeviceGrantStatement(terms)).toBe(VECTORS.grantStatement);
    expect(renderLegacyDeviceGrantStatement(terms)).toBe(
      VECTORS.legacyGrantStatement
    );
    expect(buildDeviceGrantUrn(terms)).toBe(VECTORS.grantResource);
  });

  it.each([
    ["current", VECTORS.grantStatement, VECTORS.grantId],
    ["legacy", VECTORS.legacyGrantStatement, VECTORS.legacyGrantId],
  ])(
    "parses the full %s grant SIWE message and reproduces its grant id",
    (_name, statement, grantId) => {
      const message = buildVectorGrantMessage({ statement });
      expect(hashMessage(message)).toBe(grantId);
      expect(parseDeviceGrantMessage(message)).toEqual({
        address: "0x1111111111111111111111111111111111111111",
        deviceKeyHex: VECTORS.deviceKey,
        scopes: ["post", "edit", "delete", "react"],
        expiresAtSeconds: VECTORS.grantExpiresAtSeconds,
        domain: "staging.6529.io",
        chainId: 1,
      });
    }
  );
});
