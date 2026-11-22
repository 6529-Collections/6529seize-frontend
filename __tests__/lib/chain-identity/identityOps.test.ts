import {
  capabilityRevoke,
  createdGrantId,
  createdPrincipalId,
  DELEGATION_SCOPE,
  delegationRevoke,
  delegationSet,
  fundIdentity,
  handleClaim,
  identityCreate,
  identityJoin,
  identityRemove,
  normalizeHandle,
  profileReplace,
  ratingSet,
  sessionKeyGrant,
} from "@/lib/chain-identity/identityOps";
import { objectId, repCategoryId } from "@/lib/chain/codec/ids";
import { pinnedTypes } from "@/lib/chain-identity/typedDataTypes";

const P = `0x${"0a".repeat(32)}` as const;
const W = "0xAbCdEf0000000000000000000000000000000001" as const;
const T = `0x${"0c".repeat(32)}` as const;
const TX = `0x${"0d".repeat(32)}` as const;
const ZERO = `0x${"00".repeat(32)}`;

describe("operation requests", () => {
  it("creates an identity from a wallet, with principal zero", () => {
    const { request, primaryType } = identityCreate(W, "gm_6529", null);
    expect(primaryType).toBe("IdentityCreate");
    expect(request).toEqual({
      opType: "IDENTITY_CREATE",
      principal: null,
      keyType: 1,
      signer: W.toLowerCase(),
      body: { legacyId: null, handle: "gm_6529", profileDocCid: "0x" },
    });
  });

  it("names the objects a transaction creates as the chain does", () => {
    expect(createdPrincipalId(TX)).toBe(objectId(TX, 0, 0x0101));
    expect(createdGrantId(TX)).toBe(objectId(TX, 0, 0x0301));
  });

  it("takes only handles the chain takes", () => {
    expect(normalizeHandle(" GM_6529 ")).toBe("gm_6529");
    expect(normalizeHandle("ab")).toBeNull();
    expect(normalizeHandle("has-dash")).toBeNull();
    expect(normalizeHandle("a".repeat(16))).toBeNull();
  });

  it("rates with a category id and name for REP, none for NIC", () => {
    const rep = ratingSet(
      P,
      { kind: "wallet", address: W },
      { matter: "REP", target: T, category: "Art", value: -3n, priorVersion: 12 }
    );
    expect(rep.request.body).toEqual({
      matter: 1,
      targetKind: 1,
      target: T,
      category: repCategoryId("Art"),
      categoryName: "Art",
      value: "-3",
      priorVersion: "12",
    });
    const nic = ratingSet(
      P,
      { kind: "session", keyId: TX, grantId: T },
      { matter: "NIC", target: T, category: "ignored", value: 10n, priorVersion: 0 }
    );
    expect(nic.request).toMatchObject({ keyType: 2, keyId: TX, authRef: T });
    expect(nic.request.body).toMatchObject({
      matter: 2,
      category: ZERO,
      categoryName: "",
    });
  });

  it("refuses a REP category outside the chain's alphabet", () => {
    expect(() =>
      ratingSet(
        P,
        { kind: "wallet", address: W },
        { matter: "REP", target: T, category: "Art!", value: 1n, priorVersion: 0 }
      )
    ).toThrow(RangeError);
  });

  it("grants this browser's key PROFILE_REPLACE and RATING_SET with budgets", () => {
    const { request } = sessionKeyGrant(P, W, {
      keyId: TX,
      publicKeyHex: `0x${"0e".repeat(32)}`,
      currencyAsset: T,
      feeBudget: 900n,
      expiresAtMs: 1_766_000_000_000,
    });
    expect(request.body).toMatchObject({
      granteeKind: 1,
      grantee: TX,
      granteeKeyType: 2,
      ops: [0x0102, 0x0701],
      scopes: [],
      expiresAt: "1766000000000",
      acceptMode: 1,
    });
    expect(request.body["budgets"]).toEqual([
      { kind: 1, assetId: ZERO, limit: (1n << 59n).toString() },
      { kind: 2, assetId: ZERO, limit: (1n << 59n).toString() },
      { kind: 4, assetId: T, limit: "900" },
    ]);
  });

  it("joins a wallet with the identity's wallet as the first signer", () => {
    const { request } = identityJoin(
      P,
      W,
      "0x00000000000000000000000000000000000000AA"
    );
    expect(request).toMatchObject({
      principal: P,
      signer: W.toLowerCase(),
      body: { wallet: "0x00000000000000000000000000000000000000aa" },
    });
  });

  it("sets and revokes delegations by NFTDelegation's key", () => {
    const delegation = {
      collection: "0x8888888888888888888888888888888888888888" as const,
      delegate: W,
      useCase: 2,
      tokenId: null,
    };
    expect(delegationSet(null, W, delegation, 0n).request).toMatchObject({
      principal: null,
      body: {
        collection: "0x8888888888888888888888888888888888888888",
        delegate: W.toLowerCase(),
        useCase: 2,
        allTokens: 1,
        tokenId: ZERO,
        expiry: "0",
      },
    });
    const revoke = delegationRevoke(null, W, {
      ...delegation,
      tokenId: 255n,
      scope: DELEGATION_SCOPE.WALLET,
      holder: W,
    });
    expect(revoke.request.body).toMatchObject({
      scope: 2,
      holder: `0x${"00".repeat(12)}${W.slice(2).toLowerCase()}`,
      allTokens: 0,
      tokenId: `0x${"00".repeat(31)}ff`,
    });
  });

  it("funds the identity from the wallet's own account", () => {
    expect(fundIdentity(W, P, T, 10n).request).toMatchObject({
      opType: "BALANCE_TRANSFER",
      principal: null,
      body: {
        assetId: T,
        amount: "10",
        recipientKind: 1,
        recipient: P,
        memo: null,
      },
    });
  });
});

describe("pinned EIP-712 types", () => {
  it("cover every operation this site builds, field for field", () => {
    const delegation = {
      collection: W,
      delegate: W,
      useCase: 1,
      tokenId: null,
    };
    const built = [
      identityCreate(W, "", null),
      profileReplace(P, { kind: "wallet", address: W }, 0, "0x01"),
      handleClaim(P, W, "gm_6529", ""),
      ratingSet(
        P,
        { kind: "wallet", address: W },
        { matter: "NIC", target: T, category: null, value: 1n, priorVersion: 0 }
      ),
      sessionKeyGrant(P, W, {
        keyId: TX,
        publicKeyHex: TX,
        currencyAsset: T,
        feeBudget: 1n,
        expiresAtMs: 1,
      }),
      capabilityRevoke(P, W, TX, 1),
      identityJoin(P, W, W),
      identityRemove(P, W, W),
      delegationSet(P, W, delegation, 0n),
      delegationRevoke(P, W, {
        ...delegation,
        scope: DELEGATION_SCOPE.IDENTITY,
        holder: P,
      }),
      fundIdentity(W, P, T, 1n),
    ];
    for (const { request, primaryType } of built) {
      const types = pinnedTypes(primaryType);
      expect(types).not.toBeNull();
      expect(
        types?.[`${primaryType}Body`]?.map((field) => field.name)
      ).toEqual(Object.keys(request.body));
    }
  });
});
