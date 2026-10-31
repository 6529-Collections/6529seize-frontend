import { webcrypto } from "node:crypto";

// Shared DN1 contract vectors (contract section 6), copied verbatim. The
// backend pins the same grant statements and grant ids.
export const VECTORS = {
  salt: "0x4887f15a22b96f574a9f835b87e01e293dc7587acbfc13b5f224b89cd2d8c8aa",
  seedHex: "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
  deviceKey:
    "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
  authRef: "0xe0b23044ded5e97599cd0d3f4ae0234df6aa13c90c633a9f12d9f597ea7f20bc",
  body: {
    wave_id: "4a1e0e2c-7a7d-4b38-9c0b-2f1d6d1c9a10",
    title: null,
    parts: [
      {
        content: 'gm é😀 "q"',
        media: [],
        quoted_drop: null,
      },
    ],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
    reply_to: {
      drop_id: "b0c5d6e7-1111-4222-8333-944455556666",
      drop_part_id: 1,
    },
    signature: null,
    is_safe_signature: false,
    signer_address: "0x1111111111111111111111111111111111111111",
    drop_type: "CHAT",
    hide_link_preview: false,
  },
  canonicalBody:
    '{"drop_type":"CHAT","hide_link_preview":false,"is_safe_signature":false,"mentioned_users":[],"metadata":[],"parts":[{"content":"gm é😀 \\"q\\"","media":[],"quoted_drop":null}],"referenced_nfts":[],"reply_to":{"drop_id":"b0c5d6e7-1111-4222-8333-944455556666","drop_part_id":1},"signature":null,"signer_address":"0x1111111111111111111111111111111111111111","title":null,"wave_id":"4a1e0e2c-7a7d-4b38-9c0b-2f1d6d1c9a10"}',
  bodyHash:
    "0x21f35f2f1bfccadb13cb9ad660c3f7c38d971327557f4bf921b37511d808fcf5",
  bodySize: 418,
  event: {
    kind: 1,
    kindVersion: 1,
    wave: "4a1e0e2c-7a7d-4b38-9c0b-2f1d6d1c9a10",
    author: "0x1111111111111111111111111111111111111111",
    keyType: 2,
    deviceKey:
      "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    authRef:
      "0xe0b23044ded5e97599cd0d3f4ae0234df6aa13c90c633a9f12d9f597ea7f20bc",
    seq: 1760000000000,
    anchor: 0,
    claimedTime: 1760000000123,
    refs: ["b0c5d6e7-1111-4222-8333-944455556666"],
    bodyHash:
      "0x21f35f2f1bfccadb13cb9ad660c3f7c38d971327557f4bf921b37511d808fcf5",
    bodySize: 418,
  },
  eventId: "0x85085439fde88ab7c9c2979f922c1eb9d3b7f528819e6e7c3befad77f935b02a",
  signature:
    "0xf8c7552edc9013ef82b331037b34dd7ae20fa4a6aab9feea1d906c6ee1b906db03e20254917fce0832ce5768e3a676fad76cb9d47d12b5e74536aa11e9e9cf04",
  tombstone: {
    kind: 3,
    kindVersion: 1,
    wave: "4a1e0e2c-7a7d-4b38-9c0b-2f1d6d1c9a10",
    author: "0x1111111111111111111111111111111111111111",
    keyType: 2,
    deviceKey:
      "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    authRef:
      "0xe0b23044ded5e97599cd0d3f4ae0234df6aa13c90c633a9f12d9f597ea7f20bc",
    seq: 1760000000001,
    anchor: 0,
    claimedTime: 1760000000123,
    refs: ["b0c5d6e7-1111-4222-8333-944455556666"],
    bodyHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    bodySize: 0,
  },
  tombstoneEventId:
    "0x13ad6341cb212fcaee1b119a7fd2b65eba48e74310b1725dabc4697ec99355be",
  // The statement the server renders into new grant challenges.
  grantStatement:
    "Sign in to 6529 and turn on signed messages on this device until 16 Apr 2027. This device will sign your posts, edits, deletes and reactions so anyone can verify they came from your wallet. It can't move funds, change your handle, add devices or act as an admin. No transaction, no gas, no token approvals. (Device key d75a9801...f707511a)",
  // The statement of grants issued before the current wording; still valid.
  legacyGrantStatement:
    "Sign in to 6529 and let this device post as you until 2027-04-16 12:00 UTC (device key d75a9801...f707511a). It may post, edit, delete and react. It cannot move funds, change your handle, add devices or act as an admin. This request does not create a blockchain transaction, cost gas, or approve tokens.",
  grantResource:
    "urn:6529:device-grant:v1:ed25519:d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a:post.edit.delete.react:1807876800",
  grantExpiresAtSeconds: 1807876800,
  // EIP-191 hashes of buildVectorGrantMessage() with each statement.
  grantId: "0x570275df514a120bb521f4e45c6cdc6613101cd36e9e9cfa8a46a6a4fdda886c",
  legacyGrantId:
    "0xbfa3bda34f9f8db49268ce338e3f3719a4191e879825ae7d8ebd41fb1567bfac",
} as const;

export const buildVectorGrantMessage = ({
  address = "0x1111111111111111111111111111111111111111",
  statement = VECTORS.grantStatement,
  resources = [VECTORS.grantResource],
}: {
  readonly address?: string;
  readonly statement?: string;
  readonly resources?: readonly string[];
} = {}): string =>
  [
    "https://staging.6529.io wants you to sign in with your Ethereum account:",
    address,
    "",
    statement,
    "",
    "URI: https://staging.6529.io",
    "Version: 1",
    "Chain ID: 1",
    "Nonce: a1b2c3d4e5f60718293a4b5c6d7e8f90",
    "Issued At: 2026-10-12T12:00:00.000Z",
    "Expiration Time: 2026-10-12T12:05:00.000Z",
    "Resources:",
    ...resources.map((resource) => `- ${resource}`),
  ].join("\n");

/** Gives the jsdom realm Node's WebCrypto, including Ed25519. */
export const installNodeWebCrypto = (): void => {
  Object.defineProperty(globalThis.crypto, "subtle", {
    configurable: true,
    value: webcrypto.subtle,
  });
};

const PKCS8_ED25519_PREFIX = "302e020100300506032b657004220420";

/** The RFC 8032 test 1 private key behind the vector device key. */
export const importVectorPrivateKey = async (): Promise<CryptoKey> =>
  await webcrypto.subtle.importKey(
    "pkcs8",
    Buffer.from(`${PKCS8_ED25519_PREFIX}${VECTORS.seedHex}`, "hex"),
    { name: "Ed25519" },
    false,
    ["sign"]
  );
