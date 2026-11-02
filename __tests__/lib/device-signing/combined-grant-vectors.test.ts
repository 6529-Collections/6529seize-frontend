import { hashMessage } from "viem";
import {
  buildDeviceGrantUrn,
  buildMlsDeviceGrantUrn,
  isExpectedDeviceGrantMessage,
  parseDeviceGrantMessage,
  renderCombinedGrantStatement,
  renderDeviceGrantStatement,
  renderLegacyDeviceGrantStatement,
} from "@/lib/device-signing/grant-message";

// Shared NC8 combined-grant vectors, copied verbatim from the backend's
// src/api-serverless/src/device-signing/combined-device-grant.test.ts.
const SIGNING_KEY =
  "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";
// RFC 8032 test 2 public key, standing in for an MLS signature key.
const MLS_KEY =
  "0x3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c";
const EXPIRES_AT = 1807876800;
const SIGNING_URN =
  "urn:6529:device-grant:v1:ed25519:d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a:post.edit.delete.react:1807876800";
const MLS_URN =
  "urn:6529:mls-device-grant:v1:1:3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c:1807876800";
const COMBINED_STATEMENT =
  "Sign in to 6529 and turn on signed messages on this device until 16 Apr 2027. This device will sign your posts, edits, deletes and reactions so anyone can verify they came from your wallet. It will also encrypt (send) and decrypt (read) your end-to-end encrypted messages, which 6529.io cannot read. It can't move funds, change your handle, add devices or act as an admin. No transaction, no gas, no token approvals. (Device key d75a9801...f707511a, encrypted messages key 3d4017c3...2af4660c)";
const COMBINED_GRANT_ID =
  "0xca11c99bc2a1f2b66548938658527f5f38ca468e948688f5c779a29dc94b5053";

const SIGNING = {
  deviceKeyHex: SIGNING_KEY,
  scopes: ["post", "edit", "delete", "react"],
  expiresAtSeconds: EXPIRES_AT,
};
const MLS = {
  deviceKeyHex: MLS_KEY,
  ciphersuite: 1,
  expiresAtSeconds: EXPIRES_AT,
};

const combinedMessage = ({
  statement = COMBINED_STATEMENT,
  resources = [SIGNING_URN, MLS_URN],
}: {
  readonly statement?: string;
  readonly resources?: readonly string[];
} = {}): string =>
  [
    "https://staging.6529.io wants you to sign in with your Ethereum account:",
    "0x1111111111111111111111111111111111111111",
    "",
    statement,
    "",
    "URI: https://staging.6529.io",
    "Version: 1",
    "Chain ID: 1",
    "Nonce: a1b2c3d4e5f60718293a4b5c6d7e8f90",
    "Issued At: 2026-10-18T12:00:00.000Z",
    "Expiration Time: 2026-10-18T12:05:00.000Z",
    "Resources:",
    ...resources.map((resource) => `- ${resource}`),
  ].join("\n");

describe("NC8 combined grant shared vectors", () => {
  it("builds both resources and the combined statement", () => {
    expect(buildDeviceGrantUrn(SIGNING)).toBe(SIGNING_URN);
    expect(buildMlsDeviceGrantUrn(MLS)).toBe(MLS_URN);
    expect(renderCombinedGrantStatement(SIGNING, MLS)).toBe(COMBINED_STATEMENT);
  });

  it("parses the full combined message and reproduces its grant id", () => {
    const message = combinedMessage();
    expect(hashMessage(message)).toBe(COMBINED_GRANT_ID);
    expect(parseDeviceGrantMessage(message)).toEqual({
      ...SIGNING,
      address: "0x1111111111111111111111111111111111111111",
      domain: "staging.6529.io",
      chainId: 1,
      mls: MLS,
    });
  });

  it("keeps the approved signed-messages wording around one added clause", () => {
    expect(
      COMBINED_STATEMENT.replace(
        " It will also encrypt (send) and decrypt (read) your end-to-end encrypted messages, which 6529.io cannot read.",
        ""
      ).replace(", encrypted messages key 3d4017c3...2af4660c)", ")")
    ).toBe(renderDeviceGrantStatement(SIGNING));
  });

  it.each([
    ["current", renderDeviceGrantStatement(SIGNING)],
    ["legacy", renderLegacyDeviceGrantStatement(SIGNING)],
  ])(
    "still parses %s signing-only grants without an MLS grant",
    (_name, statement) => {
      const parsed = parseDeviceGrantMessage(
        combinedMessage({ statement, resources: [SIGNING_URN] })
      );
      expect(parsed?.deviceKeyHex).toBe(SIGNING_KEY);
      expect(parsed).not.toHaveProperty("mls");
    }
  );

  it.each([
    ["the resources swapped", { resources: [MLS_URN, SIGNING_URN] }],
    ["a third resource", { resources: [SIGNING_URN, MLS_URN, MLS_URN] }],
    [
      "the signing statement over both resources",
      { statement: renderDeviceGrantStatement(SIGNING) },
    ],
    ["the combined statement over one resource", { resources: [SIGNING_URN] }],
    [
      "another MLS key in the resource",
      {
        resources: [
          SIGNING_URN,
          buildMlsDeviceGrantUrn({
            ...MLS,
            deviceKeyHex: `0x${"ab".repeat(32)}`,
          }),
        ],
      },
    ],
    [
      "another MLS expiry",
      {
        resources: [
          SIGNING_URN,
          buildMlsDeviceGrantUrn({ ...MLS, expiresAtSeconds: EXPIRES_AT - 60 }),
        ],
      },
    ],
    [
      "the signing key as the MLS key",
      {
        resources: [
          SIGNING_URN,
          buildMlsDeviceGrantUrn({ ...MLS, deviceKeyHex: SIGNING_KEY }),
        ],
        statement: renderCombinedGrantStatement(SIGNING, {
          ...MLS,
          deviceKeyHex: SIGNING_KEY,
        }),
      },
    ],
    [
      "an edited encrypted-messages clause",
      {
        statement: COMBINED_STATEMENT.replace(
          "which 6529.io cannot read",
          "which 6529.io can read"
        ),
      },
    ],
    [
      "ciphersuite 0",
      { resources: [SIGNING_URN, MLS_URN.replace(":v1:1:", ":v1:0:")] },
    ],
    [
      "a signing expiry with a leading zero (the backend rejects it too)",
      {
        resources: [
          SIGNING_URN.replace(":1807876800", ":01807876800"),
          MLS_URN,
        ],
      },
    ],
    [
      "a ciphersuite above uint16",
      { resources: [SIGNING_URN, MLS_URN.replace(":v1:1:", ":v1:65536:")] },
    ],
  ])("rejects %s", (_name, overrides) => {
    expect(parseDeviceGrantMessage(combinedMessage(overrides))).toBeNull();
  });
});

describe("combined sign-in challenge check", () => {
  const nowMs = Date.parse("2026-10-18T12:00:30.000Z");
  const expected = {
    signerAddress: "0x1111111111111111111111111111111111111111",
    deviceKeyHex: SIGNING_KEY,
    scopes: ["post", "edit", "delete", "react"],
    nowMs,
  };

  it("accepts a combined challenge only for exactly this MLS key", () => {
    const message = combinedMessage();
    expect(
      isExpectedDeviceGrantMessage({
        ...expected,
        message,
        mls: { deviceKeyHex: MLS_KEY, ciphersuite: 1 },
      })
    ).toBe(true);
    expect(
      isExpectedDeviceGrantMessage({
        ...expected,
        message,
        mls: { deviceKeyHex: `0x${"ab".repeat(32)}`, ciphersuite: 1 },
      })
    ).toBe(false);
    expect(
      isExpectedDeviceGrantMessage({
        ...expected,
        message,
        mls: { deviceKeyHex: MLS_KEY, ciphersuite: 79 },
      })
    ).toBe(false);
  });

  it("never signs a combined challenge when only the signing key was asked for", () => {
    expect(
      isExpectedDeviceGrantMessage({ ...expected, message: combinedMessage() })
    ).toBe(false);
  });

  it("does not accept a signing-only challenge as a combined one", () => {
    const message = combinedMessage({
      statement: renderDeviceGrantStatement(SIGNING),
      resources: [SIGNING_URN],
    });
    expect(isExpectedDeviceGrantMessage({ ...expected, message })).toBe(true);
    expect(
      isExpectedDeviceGrantMessage({
        ...expected,
        message,
        mls: { deviceKeyHex: MLS_KEY, ciphersuite: 1 },
      })
    ).toBe(false);
  });
});
