import { ratingDraft, RATER, TARGET, WALLET } from "./chainDraftFixture";
import { chainGateway } from "@/lib/chain-identity/gateway";
import {
  digestOf,
  normalizeWalletSignature,
  runOperation,
  verifyDraft,
} from "@/lib/chain-identity/operation";
import { ratingSet } from "@/lib/chain-identity/identityOps";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { draft: jest.fn(), submit: jest.fn(), getTx: jest.fn() },
}));

const walletRequest = (value = 5n) =>
  ratingSet(
    RATER,
    { kind: "wallet", address: WALLET },
    { matter: "REP", target: TARGET, category: "Art", value, priorVersion: 0 }
  );

describe("checking a draft before signing it", () => {
  it("agrees with the chain codec on the digest of the typed data", () => {
    const draft = ratingDraft();
    expect(digestOf(draft.typedData)).toBe(draft.txId);
  });

  it("accepts the draft of the operation that was asked for", () => {
    const { request, primaryType } = walletRequest();
    expect(() => verifyDraft(ratingDraft(), request, primaryType)).not.toThrow();
  });

  it("accepts a session key's draft naming its key and grant", () => {
    const keyId = `0x${"33".repeat(32)}` as const;
    const grantId = `0x${"44".repeat(32)}` as const;
    const { request, primaryType } = ratingSet(
      RATER,
      { kind: "session", keyId, grantId },
      { matter: "REP", target: TARGET, category: "Art", value: 5n, priorVersion: 0 }
    );
    const draft = ratingDraft({ keyType: 2, keyId, authRef: grantId });
    expect(() => verifyDraft(draft, request, primaryType)).not.toThrow();
    const otherGrant = ratingDraft({
      keyType: 2,
      keyId,
      authRef: `0x${"55".repeat(32)}`,
    });
    expect(() => verifyDraft(otherGrant, request, primaryType)).toThrow(
      "doesn't match"
    );
  });

  it("refuses a draft whose body differs from the request", () => {
    const { request, primaryType } = walletRequest(6n);
    expect(() => verifyDraft(ratingDraft(), request, primaryType)).toThrow(
      "The gateway's draft doesn't match this change. Nothing was signed."
    );
  });

  it("refuses a draft of another operation", () => {
    const { request } = walletRequest();
    expect(() =>
      verifyDraft(ratingDraft(), request, "BalanceTransfer")
    ).toThrow();
  });

  it("refuses a draft whose txId is not the digest of its typed data", () => {
    const { request, primaryType } = walletRequest();
    const draft = { ...ratingDraft(), txId: `0x${"99".repeat(32)}` as const };
    expect(() => verifyDraft(draft, request, primaryType)).toThrow();
  });

  it("refuses typed data changed after the txId was set", () => {
    const { request, primaryType } = walletRequest();
    const draft = ratingDraft();
    const tampered = {
      ...draft,
      typedData: {
        ...draft.typedData,
        message: {
          ...draft.typedData.message,
          header: {
            ...(draft.typedData.message["header"] as Record<string, unknown>),
            maxFee: "999999999999",
          },
        },
      },
    };
    expect(() => verifyDraft(tampered, request, primaryType)).toThrow();
  });
});

describe("wallet signatures", () => {
  const r = "11".repeat(32);
  const lowS = "22".repeat(32);

  it("moves v 0 and 1 to 27 and 28", () => {
    expect(normalizeWalletSignature(`0x${r}${lowS}00`)).toBe(`0x${r}${lowS}1b`);
    expect(normalizeWalletSignature(`0x${r}${lowS}01`)).toBe(`0x${r}${lowS}1c`);
  });

  it("keeps a canonical signature as it is", () => {
    expect(normalizeWalletSignature(`0x${r}${lowS}1b`)).toBe(`0x${r}${lowS}1b`);
  });

  it("takes s to the lower half and flips v", () => {
    const n =
      0xfffffffffffffffffffffffffffffffebaae6dc5c63e1aaa5c56d1d7f6b49ee1n;
    const highS = n - 5n;
    const signature = `0x${r}${highS.toString(16)}1b` as const;
    expect(normalizeWalletSignature(signature)).toBe(
      `0x${r}${(5n).toString(16).padStart(64, "0")}1c`
    );
  });

  it("refuses a signature that is not 65 bytes", () => {
    expect(() => normalizeWalletSignature(`0x${r}${lowS}`)).toThrow();
  });
});

describe("what the signature is bound to", () => {
  it("hashes with this site's types, not the gateway's", () => {
    const { request, primaryType } = walletRequest();
    const draft = ratingDraft();
    const renamed = {
      ...draft,
      typedData: {
        ...draft.typedData,
        types: {
          ...draft.typedData.types,
          RatingSetBody: [{ name: "value", type: "int64" }],
        },
      },
    };
    expect(() => verifyDraft(renamed, request, primaryType)).not.toThrow();
    expect(digestOf(renamed.typedData)).toBe(draft.txId);
  });

  it("refuses an operation this site doesn't sign", () => {
    const draft = ratingDraft();
    const other = {
      ...draft,
      typedData: { ...draft.typedData, primaryType: "PolicySet" },
    };
    expect(() =>
      verifyDraft(other, walletRequest().request, "PolicySet")
    ).toThrow();
  });

  it("refuses a fee in the signed header other than the one shown", () => {
    const { request, primaryType } = walletRequest();
    const draft = ratingDraft();
    const shownLower = { ...draft, fee: { ...draft.fee, maxFee: "1" } };
    expect(() => verifyDraft(shownLower, request, primaryType)).toThrow();
  });

  it("refuses a draft that offers the block a tip", () => {
    const { request, primaryType } = walletRequest();
    const tipped = ratingDraft({ tipPerRU: 5n });
    // The digest is right: the tip alone is refused.
    expect(digestOf(tipped.typedData)).toBe(tipped.txId);
    expect(() => verifyDraft(tipped, request, primaryType)).toThrow(
      "The gateway's draft doesn't match this change. Nothing was signed."
    );
  });

  it("refuses a signed maxWork below the draft's", () => {
    const { request, primaryType } = walletRequest();
    const draft = ratingDraft();
    // The gateway's draft says bound plus margin; the header to be signed
    // (its digest is the txId) carries less.
    const workAbove = {
      ...draft,
      fee: { ...draft.fee, maxWork: String(124_200 + 100_000) },
    };
    expect(() => verifyDraft(workAbove, request, primaryType)).toThrow();
  });

  it("never signs a session key's REP or NIC below the draft's maxWork", async () => {
    const keyId = `0x${"33".repeat(32)}` as const;
    const grantId = `0x${"44".repeat(32)}` as const;
    const { request, primaryType } = ratingSet(
      RATER,
      { kind: "session", keyId, grantId },
      { matter: "REP", target: TARGET, category: "Art", value: 5n, priorVersion: 0 }
    );
    const draft = ratingDraft({ keyType: 2, keyId, authRef: grantId });
    const sign = jest.fn();
    (chainGateway.draft as jest.Mock).mockResolvedValue({
      ...draft,
      fee: { ...draft.fee, maxWork: String(124_200 + 100_000) },
    });
    await expect(
      runOperation(request, primaryType, { keyType: 2, sign })
    ).rejects.toMatchObject({ reason: "draft_mismatch" });
    expect(sign).not.toHaveBeenCalled();
    expect(chainGateway.submit).not.toHaveBeenCalled();
  });

  it("never asks the gateway for its own maxWork, fee cap or tip", () => {
    const keyId = `0x${"33".repeat(32)}` as const;
    const grantId = `0x${"44".repeat(32)}` as const;
    for (const actor of [
      { kind: "wallet", address: WALLET } as const,
      { kind: "session", keyId, grantId } as const,
    ]) {
      const { request } = ratingSet(RATER, actor, {
        matter: "NIC",
        target: TARGET,
        category: null,
        value: 5n,
        priorVersion: 0,
      });
      for (const key of ["maxWork", "maxFee", "tipPerRu"]) {
        expect(request).not.toHaveProperty(key);
      }
    }
  });

  it("refuses another domain version", () => {
    const { request, primaryType } = walletRequest();
    const draft = ratingDraft();
    const v2 = {
      ...draft,
      typedData: {
        ...draft.typedData,
        domain: { ...draft.typedData.domain, version: "2" },
      },
    };
    expect(() => verifyDraft(v2, request, primaryType)).toThrow();
  });
});
