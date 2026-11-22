import { setTestPublicEnv } from "@/__tests__/helpers/testPublicEnv";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";
import { objectId } from "@/lib/chain/codec/ids";
import {
  isChainIdentityActive,
  isRatingPaused,
} from "@/lib/chain-identity/active";
import { dripMessage } from "@/lib/chain-identity/drip";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { pendingJoins, type PendingJoin } from "@/lib/chain-identity/pendingJoin";
import { keepSessionKey, planSession } from "@/lib/chain-identity/session";
import { sessionKeyStore } from "@/lib/chain-identity/sessionKey";
import {
  readGrant,
  readIdentityBalance,
  readWalletBalance,
} from "@/lib/chain-identity/state";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        NEXT_PUBLIC_IDENTITY_FREEZE_AT: (
          globalThis as { __identityFreezeAt?: string }
        ).__identityFreezeAt,
        ...(globalThis as { __testPublicEnv?: object }).__testPublicEnv,
      };
    },
  };
});

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: {
    getState: jest.fn(),
    getOps: jest.fn(),
    draft: jest.fn(),
  },
}));

jest.mock("@/lib/chain-identity/sessionKey", () => ({
  ...jest.requireActual("@/lib/chain-identity/sessionKey"),
  createSessionKeyPair: jest.fn(async () => ({
    keyPair: { privateKey: {}, publicKey: {} },
    publicKeyHex: `0x${"0e".repeat(32)}`,
    keyId: `0x${"0f".repeat(32)}`,
  })),
  sessionKeyStore: { read: jest.fn(), write: jest.fn(), remove: jest.fn() },
}));

const gateway = chainGateway as unknown as {
  getState: jest.Mock;
  getOps: jest.Mock;
  draft: jest.Mock;
};
const P = `0x${"0a".repeat(32)}` as const;
const ASSET = `0x${"0b".repeat(32)}` as const;
const WALLET = "0x00000000000000000000000000000000000000aa" as const;
const FREEZE = Date.UTC(2026, 10, 24);
const DAY = 86_400_000;

beforeEach(() => {
  jest.clearAllMocks();
  setTestPublicEnv({});
  setIdentityFreezeAt(undefined);
});

describe("when the chain path runs", () => {
  it("runs only with the flag on and the switch-on passed", () => {
    setIdentityFreezeAt("2026-11-24T00:00:00Z");
    setTestPublicEnv({
      NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY: "true",
      NEXT_PUBLIC_CHAIN_GATEWAY_URL: "https://gateway.example.test",
    });
    expect(isChainIdentityActive(FREEZE - 1)).toBe(false);
    expect(isChainIdentityActive(FREEZE + 1)).toBe(false);
    expect(isChainIdentityActive(FREEZE + DAY)).toBe(true);
    expect(isRatingPaused(FREEZE - 1)).toBe(false);
    expect(isRatingPaused(FREEZE + 1)).toBe(true);
    expect(isRatingPaused(FREEZE + DAY)).toBe(false);
  });

  it("keeps ratings paused after the switch-on without the flag", () => {
    setIdentityFreezeAt("2026-11-24T00:00:00Z");
    expect(isChainIdentityActive(FREEZE + DAY)).toBe(false);
    expect(isRatingPaused(FREEZE + DAY)).toBe(true);
  });
});

describe("chain state reads", () => {
  it("keys balances by holder kind, holder and asset", async () => {
    gateway.getState.mockResolvedValue({ valueFields: { amount: "1500" } });
    await expect(readIdentityBalance(P, ASSET)).resolves.toBe(1500n);
    expect(gateway.getState).toHaveBeenLastCalledWith(
      `0x090101${"0a".repeat(32)}${"0b".repeat(32)}`,
      undefined
    );
    gateway.getState.mockResolvedValue({ valueFields: null });
    await expect(readWalletBalance(WALLET, ASSET)).resolves.toBe(0n);
    expect(gateway.getState).toHaveBeenLastCalledWith(
      `0x090102${"00".repeat(12)}${WALLET.slice(2)}${"0b".repeat(32)}`,
      undefined
    );
  });

  it("reads a grant as active while ACTIVE and unexpired", async () => {
    gateway.getState.mockResolvedValue({
      valueFields: { status: 2, version: 3, expiresAt: "2000" },
    });
    await expect(readGrant(P, 1000)).resolves.toEqual({
      active: true,
      version: 3,
      expiresAtMs: 2000,
    });
    await expect(readGrant(P, 2000)).resolves.toMatchObject({ active: false });
    gateway.getState.mockResolvedValue({ valueFields: null });
    await expect(readGrant(P, 1000)).resolves.toBeNull();
  });
});

describe("chain actions on this browser", () => {
  it("sizes the fee budget from the grant's own worst-case fee", async () => {
    gateway.getOps.mockResolvedValue({ ruleVersion: 6, currencyAsset: ASSET });
    gateway.draft.mockResolvedValue({ fee: { maxFee: "250" } });
    const plan = await planSession(P, WALLET, 1_000);
    expect(plan.feeBudget).toBe(100_000n);
    expect(plan.expiresAtMs).toBe(1_000 + 30 * DAY);
    expect(gateway.draft.mock.calls[0][0]).toMatchObject({
      opType: "CAPABILITY_GRANT",
      principal: P,
      body: { grantee: `0x${"0f".repeat(32)}`, granteeKeyType: 2 },
    });
  });

  it("keeps the key with its grant id once the grant is final", async () => {
    gateway.getOps.mockResolvedValue({ ruleVersion: 6, currencyAsset: ASSET });
    gateway.draft.mockResolvedValue({ fee: { maxFee: "1" } });
    const plan = await planSession(P, WALLET, 0);
    const txId = `0x${"0c".repeat(32)}` as const;
    await keepSessionKey(P, plan, txId);
    expect(sessionKeyStore.write).toHaveBeenCalledWith(
      expect.objectContaining({
        principalId: P,
        keyId: `0x${"0f".repeat(32)}`,
        grantId: objectId(txId, 0, 0x0301),
        expiresAtMs: 30 * DAY,
      })
    );
  });
});

describe("the drip and held joins", () => {
  it("asks the drip with its exact message", () => {
    expect(dripMessage("0x00000000000000000000000000000000000000AA")).toBe(
      "Send $fake6529 for fees to this wallet on the 6529 chain.\n\nWallet: 0x00000000000000000000000000000000000000aa"
    );
  });

  it("holds one join per joining wallet until it expires", () => {
    localStorage.clear();
    const join = (wallet: string, expiresAtMs: number) =>
      ({
        principalId: P,
        identityWallet: WALLET,
        joiningWallet: wallet,
        identitySignature: "0x01",
        expiresAtMs,
        draft: { txId: "0x02" },
      }) as unknown as PendingJoin;
    pendingJoins.save(join("0xB", 5_000), 0);
    pendingJoins.save(join("0xb", 6_000), 0);
    pendingJoins.save(join("0xC", 1_000), 0);
    expect(pendingJoins.list(2_000).map((item) => item.joiningWallet)).toEqual([
      "0xb",
    ]);
    pendingJoins.remove("0xB");
    expect(pendingJoins.list(0).map((item) => item.joiningWallet)).toEqual([
      "0xC",
    ]);
  });
});
