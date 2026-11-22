import { UserRejectedRequestError } from "viem";
import type { Config } from "wagmi";
import { getAccount } from "wagmi/actions";
import {
  chainGateway,
  ChainGatewayError,
} from "@/lib/chain-identity/gateway";
import {
  ChainOperationError,
  submitAndAwait,
} from "@/lib/chain-identity/operation";
import { chainProfileDocWriter } from "@/lib/chain-identity/profileDocWriter";
import {
  prepareProfileReplace,
  readCurrentProfile,
} from "@/lib/chain-identity/profileSave";
import { usableSessionKey } from "@/lib/chain-identity/session";
import { readGrant } from "@/lib/chain-identity/state";
import { ProfileDocWriteError } from "@/lib/profile-cms/chain/profile-doc-writer";
import { getWalletAddress } from "@/services/auth/auth.utils";

jest.mock("wagmi/actions", () => ({ getAccount: jest.fn() }));
jest.mock("@/services/auth/auth.utils", () => ({ getWalletAddress: jest.fn() }));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { getIdentityByWallet: jest.fn() },
}));
jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  submitAndAwait: jest.fn(async () => ({ status: "final" })),
}));
jest.mock("@/lib/chain-identity/profileSave", () => ({
  readCurrentProfile: jest.fn(),
  prepareProfileReplace: jest.fn(),
}));
jest.mock("@/lib/chain-identity/session", () => ({
  usableSessionKey: jest.fn(),
}));
jest.mock("@/lib/chain-identity/state", () => ({ readGrant: jest.fn() }));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const WALLET = "0x00000000000000000000000000000000000000aa";
/** Bound to the signed-in identity too. */
const SECOND = "0x00000000000000000000000000000000000000ab";
/** Bound to another identity. */
const OTHER = "0x00000000000000000000000000000000000000bb";
const PRINCIPAL = `0x${"0a".repeat(32)}`;
const OTHER_PRINCIPAL = `0x${"0b".repeat(32)}`;
const config = {} as Config;
const key = {
  principalId: PRINCIPAL,
  keyId: `0x${"0c".repeat(32)}`,
  grantId: `0x${"0d".repeat(32)}`,
  expiresAtMs: Number.MAX_SAFE_INTEGER,
};
const sign = jest.fn(async () => `0x${"5a".repeat(64)}`);
let txCount = 0;

const docWith = (entries: [string, string][]) => ({
  doc: { principal: PRINCIPAL, version: 3, prev: "0x", fields: new Map(entries) },
  unreadable: false,
});
const PUBLISHED = "bafkreiexamplepublication";
const PACKAGE = "bafkreiexamplepackage";
const setSite = (current: ReadonlyMap<string, string> | null) =>
  new Map([
    ...(current ?? []),
    ["cms.primary.publication", PUBLISHED],
    ["cms.primary.package", PACKAGE],
  ]);

beforeEach(() => {
  jest.clearAllMocks();
  txCount = 0;
  (getWalletAddress as jest.Mock).mockReturnValue(WALLET);
  (getAccount as jest.Mock).mockReturnValue({ address: WALLET });
  gateway["getIdentityByWallet"]!.mockImplementation(async (wallet: string) =>
    wallet === OTHER
      ? { principalId: OTHER_PRINCIPAL, wallets: [OTHER], profile: null }
      : {
          principalId: PRINCIPAL,
          wallets: [WALLET, SECOND],
          profile: { version: 3, docCid: "0x01", updatedHeight: 90 },
        }
  );
  (usableSessionKey as jest.Mock).mockResolvedValue(key);
  (readGrant as jest.Mock).mockResolvedValue({ active: true, version: 1 });
  (readCurrentProfile as jest.Mock).mockResolvedValue(
    docWith([
      ["bio", "gm"],
      ["cms.archive", "bafkreiarchive"],
    ])
  );
  (prepareProfileReplace as jest.Mock).mockImplementation(async () => {
    txCount += 1;
    return {
      draft: { txId: `0x${String(txCount).padStart(64, "0")}` },
      signer: { keyType: 2, sign },
    };
  });
});

describe("the signers this browser offers", () => {
  it("offers the session key first when this browser has one", async () => {
    await expect(chainProfileDocWriter(config).availableSigners()).resolves.toEqual(
      ["session-key", "wallet"]
    );
  });

  it("offers the wallet alone without a key", async () => {
    (usableSessionKey as jest.Mock).mockResolvedValue(null);
    await expect(chainProfileDocWriter(config).availableSigners()).resolves.toEqual(
      ["wallet"]
    );
  });

  it("offers nothing when signed out or without an identity", async () => {
    (getWalletAddress as jest.Mock).mockReturnValue(null);
    await expect(chainProfileDocWriter(config).availableSigners()).resolves.toEqual([]);
    (getWalletAddress as jest.Mock).mockReturnValue(WALLET);
    gateway["getIdentityByWallet"]!.mockResolvedValue(null);
    await expect(chainProfileDocWriter(config).availableSigners()).resolves.toEqual([]);
  });
});

describe("replacing the profile document", () => {
  it("applies the edit over every current field and signs with the key", async () => {
    const result = await chainProfileDocWriter(config).replaceProfileDoc(
      setSite,
      "session-key"
    );
    expect(result).toEqual({ txId: `0x${"1".padStart(64, "0")}` });
    const [, fields, signing] = (prepareProfileReplace as jest.Mock).mock.calls[0];
    expect(Object.fromEntries(fields)).toEqual({
      bio: "gm",
      "cms.archive": "bafkreiarchive",
      "cms.primary.publication": PUBLISHED,
      "cms.primary.package": PACKAGE,
    });
    expect(signing).toMatchObject({ wallet: WALLET, sessionKey: key });
    expect(submitAndAwait).toHaveBeenCalledWith({ txId: result.txId }, [
      { role: 0, keyType: 2, sig: `0x${"5a".repeat(64)}` },
    ]);
  });

  it("signs with the wallet when asked to", async () => {
    await chainProfileDocWriter(config).replaceProfileDoc(setSite, "wallet");
    expect((prepareProfileReplace as jest.Mock).mock.calls[0][2]).toMatchObject({
      sessionKey: null,
    });
    expect(usableSessionKey).not.toHaveBeenCalled();
  });

  it("changes the signed-in profile's site, whichever account the wallet app is on", async () => {
    // The wallet app is on a wallet of another identity.
    (getAccount as jest.Mock).mockReturnValue({ address: OTHER });
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "wallet")
    ).rejects.toEqual(
      new ProfileDocWriteError(
        "submit_failed",
        "Switch your wallet to 0x0000…00aa and try again."
      )
    );
    expect(gateway["getIdentityByWallet"]).toHaveBeenCalledWith(WALLET);
    expect(gateway["getIdentityByWallet"]).not.toHaveBeenCalledWith(OTHER);
    expect(prepareProfileReplace).not.toHaveBeenCalled();
    // The session key signs for the signed-in identity, not the app's account.
    await chainProfileDocWriter(config).replaceProfileDoc(setSite, "session-key");
    expect((prepareProfileReplace as jest.Mock).mock.calls[0][0]).toMatchObject({
      principalId: PRINCIPAL,
    });
    expect(usableSessionKey).toHaveBeenCalledWith(PRINCIPAL);
  });

  it("lets any wallet of the identity sign", async () => {
    (getAccount as jest.Mock).mockReturnValue({ address: SECOND });
    await chainProfileDocWriter(config).replaceProfileDoc(setSite, "wallet");
    expect((prepareProfileReplace as jest.Mock).mock.calls[0][2]).toMatchObject({
      wallet: SECOND,
      sessionKey: null,
    });
  });

  it("removes both site fields to unpublish", async () => {
    (readCurrentProfile as jest.Mock).mockResolvedValue(
      docWith([
        ["bio", "gm"],
        ["cms.primary.publication", PUBLISHED],
        ["cms.primary.package", PACKAGE],
      ])
    );
    await chainProfileDocWriter(config).replaceProfileDoc((current) => {
      const next = new Map(current ?? []);
      next.delete("cms.primary.publication");
      next.delete("cms.primary.package");
      return next;
    }, "wallet");
    const fields = (prepareProfileReplace as jest.Mock).mock.calls[0][1];
    expect(Object.fromEntries(fields)).toEqual({ bio: "gm" });
  });

  it("gives the edit null when the identity has no document", async () => {
    (readCurrentProfile as jest.Mock).mockResolvedValue({ doc: null, unreadable: false });
    const edit = jest.fn(setSite);
    await chainProfileDocWriter(config).replaceProfileDoc(edit, "wallet");
    expect(edit).toHaveBeenCalledWith(null);
  });

  it("changes nothing but the site's fields", async () => {
    for (const edit of [
      (current: ReadonlyMap<string, string> | null) =>
        new Map([...(current ?? []), ["bio", "changed"]]),
      () => new Map([["cms.primary.publication", PUBLISHED]]),
      (current: ReadonlyMap<string, string> | null) =>
        new Map([...(current ?? []), ["cms.primary.other", "x"]]),
      // A publication without its package.
      (current: ReadonlyMap<string, string> | null) =>
        new Map([...(current ?? []), ["cms.primary.publication", PUBLISHED]]),
    ]) {
      await expect(
        chainProfileDocWriter(config).replaceProfileDoc(edit, "wallet")
      ).rejects.toMatchObject({ code: "submit_failed" });
    }
    expect(prepareProfileReplace).not.toHaveBeenCalled();
  });

  it("never writes over a document it can't read", async () => {
    (readCurrentProfile as jest.Mock).mockResolvedValue({ doc: null, unreadable: true });
    const edit = jest.fn(setSite);
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(edit, "wallet")
    ).rejects.toMatchObject({ code: "submit_failed" });
    expect(edit).not.toHaveBeenCalled();
    expect(prepareProfileReplace).not.toHaveBeenCalled();
  });

  it("says why when the current document can't be fetched", async () => {
    (readCurrentProfile as jest.Mock).mockRejectedValue(
      new ChainGatewayError(503, "import_running", "Still importing.")
    );
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "wallet")
    ).rejects.toEqual(new ProfileDocWriteError("submit_failed", "Still importing."));
  });

  it("applies the edit again on the newer document after STALE_VERSION", async () => {
    (submitAndAwait as jest.Mock)
      .mockRejectedValueOnce(
        new ChainOperationError("failed", "refused", "STALE_VERSION")
      )
      .mockResolvedValueOnce({ status: "final" });
    (readCurrentProfile as jest.Mock)
      .mockResolvedValueOnce(docWith([["bio", "gm"]]))
      .mockResolvedValueOnce(docWith([["bio", "newer"]]));
    const edit = jest.fn(setSite);
    const result = await chainProfileDocWriter(config).replaceProfileDoc(
      edit,
      "wallet"
    );
    expect(edit).toHaveBeenCalledTimes(2);
    expect(edit).toHaveBeenLastCalledWith(new Map([["bio", "newer"]]));
    expect(result.txId).toBe(`0x${"2".padStart(64, "0")}`);
  });

  it("tries once more after a conflict, not again: each failed try costs a fee", async () => {
    (submitAndAwait as jest.Mock).mockRejectedValue(
      new ChainOperationError("failed", "refused: STALE_VERSION.", "STALE_VERSION")
    );
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "wallet")
    ).rejects.toMatchObject({ code: "submit_failed" });
    expect(submitAndAwait).toHaveBeenCalledTimes(2);
  });
});

describe("the errors the site builder acts on", () => {
  it("says the key can't sign without a usable key or an active grant", async () => {
    (usableSessionKey as jest.Mock).mockResolvedValueOnce(null);
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "session-key")
    ).rejects.toMatchObject({ code: "session_key_unusable" });
    (readGrant as jest.Mock).mockResolvedValueOnce({ active: false, version: 2 });
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "session-key")
    ).rejects.toMatchObject({ code: "session_key_unusable" });
    expect(prepareProfileReplace).not.toHaveBeenCalled();
  });

  it("says the key can't sign when the chain refuses it", async () => {
    (submitAndAwait as jest.Mock).mockRejectedValueOnce(
      new ChainGatewayError(422, "inadmissible", "0x0207 GRANT_INACTIVE, detail 0")
    );
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "session-key")
    ).rejects.toMatchObject({ code: "session_key_unusable" });
    (submitAndAwait as jest.Mock).mockRejectedValueOnce(
      new ChainOperationError("failed", "refused", "OVER_GRANT_BUDGET")
    );
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "session-key")
    ).rejects.toMatchObject({ code: "session_key_unusable" });
  });

  it("reports a canceled wallet signature", async () => {
    (prepareProfileReplace as jest.Mock).mockRejectedValueOnce(
      new UserRejectedRequestError(new Error("User rejected."))
    );
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "wallet")
    ).rejects.toMatchObject({ code: "signature_rejected" });
  });

  it("reports other refusals as failed, with the chain's words", async () => {
    (submitAndAwait as jest.Mock).mockRejectedValueOnce(
      new ChainOperationError(
        "failed",
        "The 6529 Network refused this change: INSUFFICIENT_BALANCE.",
        "INSUFFICIENT_BALANCE"
      )
    );
    await expect(
      chainProfileDocWriter(config).replaceProfileDoc(setSite, "session-key")
    ).rejects.toEqual(
      new ProfileDocWriteError(
        "submit_failed",
        "The 6529 Network refused this change: INSUFFICIENT_BALANCE."
      )
    );
  });
});
