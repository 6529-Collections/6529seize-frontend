import { hashTypedData, keccak256, sha256 } from "viem";
import type { Config } from "wagmi";
import { getAccount, signTypedData } from "wagmi/actions";
import { setTestPublicEnv } from "@/__tests__/helpers/testPublicEnv";
import {
  chainGateway,
  ChainGatewayError,
  type ChainIdentity,
} from "@/lib/chain-identity/gateway";
import { chainNetworkId } from "@/lib/chain-identity/network";
import { draftOperation } from "@/lib/chain-identity/operation";
import {
  decodeProfileDoc,
  prepareProfileDoc,
  profileDocumentTypedData,
  signedProfileDoc,
} from "@/lib/chain-identity/profileDoc";
import {
  nextProfileFields,
  prepareProfileReplace,
  readCurrentProfile,
} from "@/lib/chain-identity/profileSave";
import { signWithSessionKey } from "@/lib/chain-identity/sessionKey";
import { signProfileDocument } from "@/lib/chain-identity/signers";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __testPublicEnv?: object }).__testPublicEnv,
      };
    },
  };
});
jest.mock("wagmi/actions", () => ({
  getAccount: jest.fn(),
  signTypedData: jest.fn(),
  signMessage: jest.fn(),
}));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: {
    getStatus: jest.fn(),
    getDoc: jest.fn(),
    getMembership: jest.fn(),
    uploadDoc: jest.fn(),
  },
}));
jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  draftOperation: jest.fn(),
}));
jest.mock("@/lib/chain-identity/sessionKey", () => ({
  ...jest.requireActual("@/lib/chain-identity/sessionKey"),
  signWithSessionKey: jest.fn(async () => `0x${"5a".repeat(64)}`),
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const NETWORK = `0x${"ab".repeat(32)}` as const;
const PRINCIPAL = `0x${"0a".repeat(32)}` as const;
const WALLET = "0x00000000000000000000000000000000000000Aa" as const;
const CURRENT_CID = `0x01551220${"11".repeat(32)}` as const;
const config = {} as Config;
const N =
  0xfffffffffffffffffffffffffffffffebaae6dc5c63e1aaa5c56d1d7f6b49ee1n;
const session = {
  principalId: PRINCIPAL,
  keyId: `0x${"0d".repeat(32)}` as const,
  grantId: `0x${"0e".repeat(32)}` as const,
  publicKeyHex: `0x${"0f".repeat(32)}` as const,
  keyPair: { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey },
  expiresAtMs: Number.MAX_SAFE_INTEGER,
};

const identity = (version: number, docCid: string = CURRENT_CID): ChainIdentity =>
  ({
    principalId: PRINCIPAL,
    profile: { docCid, version, updatedHeight: 9 },
  }) as unknown as ChainIdentity;

const draftFor = (salt: string) => ({
  txId: "0x01",
  typedData: { domain: { name: "6529 Network", version: "1", salt } },
  fee: { maxFee: "1" },
});

beforeEach(() => {
  jest.clearAllMocks();
  setTestPublicEnv({});
  gateway["getStatus"]!.mockResolvedValue({ finalized: { network: NETWORK } });
  gateway["uploadDoc"]!.mockResolvedValue({});
  (draftOperation as jest.Mock).mockResolvedValue(draftFor(NETWORK));
  (getAccount as jest.Mock).mockReturnValue({ address: WALLET });
});

describe("the network a document is signed for", () => {
  it("is the build's network when it names one, else the gateway's", async () => {
    setTestPublicEnv({ NEXT_PUBLIC_CHAIN_NETWORK_ID: NETWORK.toUpperCase().replace("0X", "0x") });
    await expect(chainNetworkId()).resolves.toBe(NETWORK);
    expect(gateway["getStatus"]).not.toHaveBeenCalled();
    setTestPublicEnv({});
    await expect(chainNetworkId()).resolves.toBe(NETWORK);
  });

  it("refuses a missing or malformed network", async () => {
    gateway["getStatus"]!.mockResolvedValue(undefined);
    await expect(chainNetworkId()).rejects.toThrow("did not say which network");
    gateway["getStatus"]!.mockResolvedValue({});
    await expect(chainNetworkId()).rejects.toThrow("did not say which network");
    gateway["getStatus"]!.mockResolvedValue({ head: { network: "0x1234" } });
    await expect(chainNetworkId()).rejects.toThrow("did not say which network");
  });
});

describe("signing a profile document", () => {
  const typed = profileDocumentTypedData(NETWORK, PRINCIPAL, 2, `0x${"77".repeat(32)}`);

  it("signs with the wallet: keyId the address word, low s, v 27 or 28", async () => {
    const r = "11".repeat(32);
    (signTypedData as jest.Mock).mockResolvedValue(
      `0x${r}${(N - 5n).toString(16)}00`
    );
    const signature = await signProfileDocument(
      config,
      { kind: "wallet", address: WALLET },
      typed
    );
    expect(signTypedData).toHaveBeenCalledWith(
      config,
      expect.objectContaining({
        account: WALLET,
        primaryType: "ProfileDocument",
        domain: { name: "6529 Network", version: "1", salt: NETWORK },
      })
    );
    expect(signature).toEqual({
      keyType: 1,
      keyId: `0x${"00".repeat(12)}${WALLET.slice(2).toLowerCase()}`,
      signature: `0x${r}${(5n).toString(16).padStart(64, "0")}1c`,
    });
  });

  it("refuses when the wallet app is on another account", async () => {
    (getAccount as jest.Mock).mockReturnValue({ address: `0x${"22".repeat(20)}` });
    await expect(
      signProfileDocument(config, { kind: "wallet", address: WALLET }, typed)
    ).rejects.toThrow("Switch your wallet");
    expect(signTypedData).not.toHaveBeenCalled();
  });

  it("signs the EIP-712 digest with this browser's key, keyType 2", async () => {
    const signature = await signProfileDocument(
      config,
      { kind: "session", record: session },
      typed
    );
    expect(signWithSessionKey).toHaveBeenCalledWith(
      session.keyPair.privateKey,
      hashTypedData(typed)
    );
    expect(signature).toEqual({
      keyType: 2,
      keyId: session.keyId,
      signature: `0x${"5a".repeat(64)}`,
    });
  });
});

describe("saving the profile", () => {
  it("keeps save off for a failed fetch or bytes that aren't the CID", async () => {
    gateway["getDoc"]!.mockRejectedValue(new Error("offline"));
    await expect(readCurrentProfile(identity(3))).rejects.toThrow("offline");
    gateway["getDoc"]!.mockResolvedValue(new Uint8Array([1, 2, 3]));
    await expect(readCurrentProfile(identity(3))).rejects.toMatchObject({
      code: "cid_mismatch",
    });
  });

  it("keeps a missing document until the import has completed", async () => {
    gateway["getDoc"]!.mockRejectedValue(
      new ChainGatewayError(404, "not_found", "missing")
    );
    gateway["getMembership"]!.mockResolvedValue({
      import: { completed: false },
    });
    await expect(readCurrentProfile(identity(1))).rejects.toMatchObject({
      code: "import_running",
    });
    gateway["getMembership"]!.mockResolvedValue({ import: null });
    await expect(readCurrentProfile(identity(1))).rejects.toMatchObject({
      code: "import_running",
    });
  });

  it("never replaces the imported version 1 on a 404, even after the import", async () => {
    gateway["getDoc"]!.mockRejectedValue(
      new ChainGatewayError(404, "not_found", "missing")
    );
    // updatedHeight 9: written by the import, which finished at 50.
    gateway["getMembership"]!.mockResolvedValue({
      import: { completed: true, doneHeight: 50 },
    });
    await expect(readCurrentProfile(identity(1))).rejects.toMatchObject({
      code: "imported_doc_missing",
    });
    // No doneHeight in the answer: treated as imported, to be safe.
    gateway["getMembership"]!.mockResolvedValue({ import: { completed: true } });
    await expect(readCurrentProfile(identity(1))).rejects.toMatchObject({
      code: "imported_doc_missing",
    });
    // No updatedHeight on the identity: treated as imported, to be safe.
    gateway["getMembership"]!.mockResolvedValue({
      import: { completed: true, doneHeight: 5 },
    });
    const noHeight = {
      principalId: PRINCIPAL,
      profile: { docCid: CURRENT_CID, version: 1 },
    } as unknown as ChainIdentity;
    await expect(readCurrentProfile(noHeight)).rejects.toMatchObject({
      code: "imported_doc_missing",
    });
    // A version 1 written after the import (IDENTITY_CREATE with a doc) may be replaced.
    gateway["getMembership"]!.mockResolvedValue({
      import: { completed: true, doneHeight: 5 },
    });
    await expect(readCurrentProfile(identity(1))).resolves.toEqual({
      doc: null,
      unreadable: true,
    });
  });

  it("lets a missing or undecodable document be replaced", async () => {
    gateway["getDoc"]!.mockRejectedValue(
      new ChainGatewayError(404, "not_found", "missing")
    );
    gateway["getMembership"]!.mockResolvedValue({
      import: { completed: true },
    });
    await expect(readCurrentProfile(identity(3))).resolves.toEqual({
      doc: null,
      unreadable: true,
    });
    const junk = new Uint8Array([1, 2, 3]);
    gateway["getDoc"]!.mockResolvedValue(junk);
    await expect(
      readCurrentProfile(identity(3, `0x01551220${sha256(junk).slice(2)}`))
    ).resolves.toEqual({ doc: null, unreadable: true });
    await expect(readCurrentProfile(identity(0, "0x"))).resolves.toEqual({
      doc: null,
      unreadable: false,
    });
  });

  it("keeps every unedited field exactly and trims only the edits", () => {
    const current = {
      principal: PRINCIPAL,
      version: 3,
      prev: "0x" as const,
      fields: new Map([
        ["bio", "gm\n"],
        ["cms.archive", "bafkarchive"],
        ["statement.X.Y.0", " @gm "],
      ]),
    };
    expect(
      Object.fromEntries(
        nextProfileFields(current, {
          website: " https://a.test ",
          bio: undefined,
          "statement.X.Y.0": " @gm ",
        })
      )
    ).toEqual({
      bio: "gm\n",
      "cms.archive": "bafkarchive",
      "statement.X.Y.0": " @gm ",
      website: "https://a.test",
    });
  });

  it("signs, stores, then drafts the next version with prev the current CID", async () => {
    const order: string[] = [];
    const onWalletPrompt = jest.fn(() => order.push("prompt"));
    (signTypedData as jest.Mock).mockImplementation(async () => {
      order.push("sign");
      return `0x${"11".repeat(32)}${"22".repeat(32)}1b`;
    });
    gateway["uploadDoc"]!.mockImplementation(async () => {
      order.push("upload");
      return {};
    });
    (draftOperation as jest.Mock).mockImplementation(async () => {
      order.push("draft");
      return draftFor(NETWORK);
    });
    const fields = new Map([["bio", "gm"]]);
    await prepareProfileReplace(identity(3), fields, {
      config,
      wallet: WALLET,
      sessionKey: null,
      onWalletPrompt,
    });
    expect(order).toEqual(["prompt", "sign", "upload", "draft"]);
    const [bytes, cid] = gateway["uploadDoc"]!.mock.calls[0]!;
    // The wallet signed this document: its principal, version and the
    // keccak256 of every byte before the signature (u32 length, then CE
    // keyType 1 byte, keyId 32, signature length 4, signature 65).
    const sigLength = 1 + 32 + 4 + 65;
    expect(
      new DataView(bytes.buffer, bytes.byteOffset).getUint32(
        bytes.length - sigLength - 4
      )
    ).toBe(sigLength);
    const unsignedBytes = bytes.slice(0, bytes.length - 4 - sigLength);
    expect((signTypedData as jest.Mock).mock.calls[0]![1]).toMatchObject({
      primaryType: "ProfileDocument",
      message: {
        principal: PRINCIPAL,
        version: 4,
        docHash: keccak256(unsignedBytes),
      },
    });
    const stored = decodeProfileDoc(bytes);
    expect(stored).toMatchObject({ version: 4, prev: CURRENT_CID });
    const { unsigned } = prepareProfileDoc(
      { principal: PRINCIPAL, version: 4, prev: CURRENT_CID, fields },
      `0x${Buffer.from(bytes.slice(4 + 18 + 32 + 4 + 4 + 36, 4 + 18 + 32 + 4 + 4 + 36 + 32)).toString("hex")}`
    );
    expect(signedProfileDoc(unsigned, {
      keyType: 1,
      keyId: `0x${"00".repeat(12)}${WALLET.slice(2).toLowerCase()}`,
      signature: `0x${"11".repeat(32)}${"22".repeat(32)}1b`,
    }).cid).toBe(cid);
    expect((draftOperation as jest.Mock).mock.calls[0]![0]).toMatchObject({
      opType: "PROFILE_REPLACE",
      principal: PRINCIPAL,
      body: { expectedVersion: 3, docCid: cid },
    });
  });

  it("refuses a transaction draft for another network", async () => {
    (draftOperation as jest.Mock).mockResolvedValue(draftFor(`0x${"cd".repeat(32)}`));
    await expect(
      prepareProfileReplace(identity(1), new Map([["bio", "gm"]]), {
        config,
        wallet: WALLET,
        sessionKey: session,
      })
    ).rejects.toThrow("for another network");
  });
});
