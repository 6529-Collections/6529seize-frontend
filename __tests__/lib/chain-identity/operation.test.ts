import { ratingDraft, RATER, TARGET, WALLET } from "./chainDraftFixture";
import {
  digestOf,
  normalizeWalletSignature,
  verifyDraft,
} from "@/lib/chain-identity/operation";
import { ratingSet } from "@/lib/chain-identity/identityOps";

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
