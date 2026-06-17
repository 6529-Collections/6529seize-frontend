import { publicEnv } from "@/config/env";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  buildDropSignatureMessage,
  buildNextgenAdminSignatureMessage,
  buildStructuredWalletSignatureMessage,
  canonicalJSONStringify,
  getWalletSignatureAudience,
  getWalletSignatureClientOrigin,
  getWalletSignatureDomain,
  hashStructuredWalletSignaturePayload,
  isStructuredSignaturesEnabled,
} from "@/services/wallet-signatures/structured-wallet-signatures";
import { DropHasher } from "@/utils/drop-hasher";

function createDrop(): ApiCreateDropRequest {
  return {
    wave_id: "wave-1",
    reply_to: undefined,
    drop_type: ApiDropType.Participatory,
    mentioned_groups: [],
    title: "Signed drop",
    parts: [
      {
        content: "Hello world",
        media: [],
        attachments: [],
      },
    ],
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_waves: [],
    metadata: [],
    signature: null,
    signer_address: "0x1111111111111111111111111111111111111111",
  };
}

describe("structured wallet signatures", () => {
  const originalBaseEndpoint = publicEnv.BASE_ENDPOINT;
  const originalApiEndpoint = publicEnv.API_ENDPOINT;
  const originalStructuredFlag = publicEnv.AUTH_STRUCTURED_SIGNATURES_ENABLED;

  beforeEach(() => {
    publicEnv.BASE_ENDPOINT = "https://www.6529.io";
    publicEnv.API_ENDPOINT = "https://api.6529.io";
    publicEnv.AUTH_STRUCTURED_SIGNATURES_ENABLED = undefined;
  });

  afterEach(() => {
    publicEnv.BASE_ENDPOINT = originalBaseEndpoint;
    publicEnv.API_ENDPOINT = originalApiEndpoint;
    publicEnv.AUTH_STRUCTURED_SIGNATURES_ENABLED = originalStructuredFlag;
  });

  it("reads the rollout flag explicitly", () => {
    expect(isStructuredSignaturesEnabled()).toBe(false);

    publicEnv.AUTH_STRUCTURED_SIGNATURES_ENABLED = "true";

    expect(isStructuredSignaturesEnabled()).toBe(true);
  });

  it("builds deterministic structured messages", () => {
    const result = buildStructuredWalletSignatureMessage({
      kind: "action",
      address: "0x1111111111111111111111111111111111111111",
      action: "nextgen_admin",
      purpose: "Sign this message to perform a 6529 NextGen admin action.",
      audience: "api.6529.io",
      domain: "example.com",
      clientOrigin: "https://example.com",
      sessionType: "external_client",
      chainId: 1,
      nonce: "nonce-12345",
      issuedAt: new Date("2026-06-10T00:00:00.000Z"),
      expirationTime: new Date("2026-06-10T00:05:00.000Z"),
      payloadHash: "a".repeat(64),
    });

    expect(result.message).toBe(
      [
        "6529 Action",
        "Version: 2",
        "Audience: api.6529.io",
        "Domain: example.com",
        "Client Origin: https://example.com",
        "Session Type: external_client",
        "Wallet: 0x1111111111111111111111111111111111111111",
        "Chain ID: 1",
        "Issued At: 2026-06-10T00:00:00.000Z",
        "Expiration Time: 2026-06-10T00:05:00.000Z",
        "Nonce: nonce-12345",
        "Action: nextgen_admin",
        `Payload Hash: ${"a".repeat(64)}`,
        "Purpose: Sign this message to perform a 6529 NextGen admin action.",
      ].join("\n")
    );
  });

  it("hashes payloads with canonical key ordering", () => {
    expect(canonicalJSONStringify({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(canonicalJSONStringify({ ä: 1, z: 2 })).toBe('{"z":2,"ä":1}');
    expect(hashStructuredWalletSignaturePayload({ b: 2, a: 1 })).toBe(
      hashStructuredWalletSignaturePayload({ a: 1, b: 2 })
    );
  });

  it("derives the signing domain from the current runtime", () => {
    const currentHost = globalThis.window?.location.host;
    const expectedDomain = currentHost
      ? currentHost.toLowerCase()
      : "www.6529.io";

    expect(getWalletSignatureDomain()).toBe(expectedDomain);
  });

  it("derives the signing audience from the API endpoint", () => {
    publicEnv.API_ENDPOINT = "https://api.6529.io/api";

    expect(getWalletSignatureAudience()).toBe("api.6529.io");
  });

  it("derives the client origin from the current runtime", () => {
    const currentOrigin = globalThis.window?.location.origin;
    const expectedOrigin = currentOrigin
      ? currentOrigin.toLowerCase()
      : "https://www.6529.io";

    expect(getWalletSignatureClientOrigin()).toBe(expectedOrigin);
  });

  it("builds drop payload hashes without signature fields", () => {
    const drop = createDrop();
    const dropWithRequestOnlySignatureMessage = {
      ...drop,
      signature: "legacy-signature",
      signature_message: "structured-message",
    };
    const termsOfService = "Terms accepted";

    const result = buildDropSignatureMessage({
      address: drop.signer_address!,
      drop: dropWithRequestOnlySignatureMessage,
      termsOfService,
    });

    expect(result.payloadHash).toBe(
      new DropHasher().hash({ drop, termsOfService })
    );
  });

  it("builds NextGen admin messages with an explicit chain id", () => {
    const result = buildNextgenAdminSignatureMessage({
      address: "0x1111111111111111111111111111111111111111",
      chainId: 11155111,
      payload: { collection_id: 1 },
    });

    expect(result.message).toContain("Chain ID: 11155111");
  });

});
