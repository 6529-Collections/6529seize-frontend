import type { Hex } from "viem";
import type { Config } from "wagmi";
import { repCategoryId } from "@/lib/chain/codec/ids";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { draftOperation, submitAndAwait } from "@/lib/chain-identity/operation";
import {
  readRatingAllowance,
  withinAllowance,
  writeChainRating,
} from "@/lib/chain-identity/ratings";
import { usableSessionKey } from "@/lib/chain-identity/session";
import { sessionSigner, walletSigner } from "@/lib/chain-identity/signers";
import {
  readIdentityBalance,
  readRaterSpent,
  readRating,
} from "@/lib/chain-identity/state";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: {
    getIdentityByWallet: jest.fn(),
    getIdentityByHandle: jest.fn(),
    getOps: jest.fn(),
  },
}));
jest.mock("@/lib/chain-identity/state", () => ({
  readRating: jest.fn(),
  readRaterSpent: jest.fn(),
  readIdentityBalance: jest.fn(),
}));
/** A RATING_SET draft as far as the writer reads it, with its signed fee. */
function mockRatingDraft(maxFee: string) {
  return {
    txId: `0x${"77".repeat(32)}`,
    typedData: {
      primaryType: "RatingSet",
      message: { header: { maxFee, maxWork: "124200" } },
    },
    unsigned: "0x4001",
    fee: { maxFee, maxWork: "124200", sizeBytes: 300 },
  };
}

jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  draftOperation: jest.fn(async () => mockRatingDraft("100")),
  submitAndAwait: jest.fn(async () => ({ status: "final" })),
}));
jest.mock("@/lib/chain-identity/session", () => ({
  usableSessionKey: jest.fn(),
}));
jest.mock("@/lib/chain-identity/signers", () => ({
  sessionSigner: jest.fn(() => ({ keyType: 2, sign: jest.fn() })),
  walletSigner: jest.fn(() => ({ keyType: 1, sign: jest.fn() })),
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const RATER: Hex = `0x${"0a".repeat(32)}`;
const TARGET: Hex = `0x${"0b".repeat(32)}`;
const WALLET = "0x00000000000000000000000000000000000000aa" as const;
const config = {} as Config;
const key = {
  principalId: RATER,
  keyId: `0x${"0c".repeat(32)}`,
  grantId: `0x${"0d".repeat(32)}`,
  expiresAtMs: Number.MAX_SAFE_INTEGER,
};

/** The rater: TDH 1,000, of which it has given 900 in REP. */
beforeEach(() => {
  jest.clearAllMocks();
  gateway["getIdentityByWallet"]!.mockImplementation(async (wallet: string) =>
    wallet === WALLET
      ? { principalId: RATER, level: { level: 3, tdh: "1000" } }
      : null
  );
  gateway["getIdentityByHandle"]!.mockResolvedValue({ principalId: TARGET });
  (readRaterSpent as jest.Mock).mockResolvedValue(900n);
  (readIdentityBalance as jest.Mock).mockResolvedValue(10_000n);
  gateway["getOps"]!.mockResolvedValue({
    ruleVersion: 6,
    currencyAsset: `0x${"0f".repeat(32)}`,
  });
  (readRating as jest.Mock).mockResolvedValue({
    value: 50n,
    updatedHeight: 77,
  });
});

const rate = (value = 120n) =>
  writeChainRating(config, WALLET, {
    matter: "REP",
    target: { handle: "rated_one", wallets: [] },
    category: "Art",
    value,
  });

it("reads the cap, what was given and the current rating from the chain", async () => {
  const allowance = await readRatingAllowance(WALLET, {
    matter: "REP",
    target: { handle: "rated_one" },
    category: "Art",
  });
  expect(allowance).toEqual({
    rater: RATER,
    target: TARGET,
    cap: 1000n,
    spent: 900n,
    available: 100n,
    current: 50n,
    version: 77,
  });
  expect(readRaterSpent).toHaveBeenCalledWith(RATER, 1, undefined);
  expect(readRating).toHaveBeenCalledWith(
    RATER,
    1,
    TARGET,
    repCategoryId("Art"),
    undefined
  );
});

it("keeps a change within the TDH, and always lets a rater give less", () => {
  const allowance = {
    rater: RATER,
    target: TARGET,
    cap: 1000n,
    spent: 900n,
    available: 100n,
    current: 50n,
    version: 77,
  } as const;
  // 900 given, 50 of it here: this rating can go up to 150 either way.
  expect(withinAllowance(allowance, 150n)).toBe(true);
  expect(withinAllowance(allowance, -150n)).toBe(true);
  expect(withinAllowance(allowance, 151n)).toBe(false);
  // Over the cap already (the TDH fell): lowering is still allowed.
  const over = { ...allowance, cap: 500n, available: 0n };
  expect(withinAllowance(over, 20n)).toBe(true);
  expect(withinAllowance(over, 60n)).toBe(false);
  // The TDH unknown: the chain decides.
  expect(withinAllowance({ ...allowance, cap: null }, 10_000n)).toBe(true);
});

it("rates with this browser's key, no wallet prompt, at the current version", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(key);
  await rate();
  expect(sessionSigner).toHaveBeenCalledWith(key);
  expect(walletSigner).not.toHaveBeenCalled();
  expect(draftOperation).toHaveBeenCalledTimes(1);
  const [request, primaryType] = (draftOperation as jest.Mock).mock.calls[0];
  expect(primaryType).toBe("RatingSet");
  expect(request).toMatchObject({
    principal: RATER,
    keyType: 2,
    keyId: key.keyId,
    authRef: key.grantId,
    body: {
      matter: 1,
      target: TARGET,
      categoryName: "Art",
      value: "120",
      priorVersion: "77",
    },
  });
});

it("asks the wallet, saying the fee first, when it is above the key's cap", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(key);
  // 1 $fake6529: far above 20 times this rating's fee at the floor.
  (draftOperation as jest.Mock).mockImplementationOnce(async () =>
    mockRatingDraft((10n ** 18n).toString())
  );
  const walletSign = jest.fn(async () => "0x5167");
  (walletSigner as jest.Mock).mockReturnValue({ keyType: 1, sign: walletSign });
  const onWalletFee = jest.fn();
  await writeChainRating(config, WALLET, {
    matter: "REP",
    target: { handle: "rated_one", wallets: [] },
    category: "Art",
    value: 120n,
    onWalletFee,
  });
  const drafts = (draftOperation as jest.Mock).mock.calls;
  expect(drafts).toHaveLength(2);
  expect(drafts[0][0]).toMatchObject({ keyType: 2, keyId: key.keyId });
  expect(drafts[1][0]).toMatchObject({ keyType: 1, signer: WALLET });
  expect(sessionSigner).not.toHaveBeenCalled();
  expect(walletSigner).toHaveBeenCalledWith(config, WALLET);
  // The wallet's own draft and its fee, said before the prompt.
  expect(onWalletFee).toHaveBeenCalledWith(100n);
  expect(onWalletFee.mock.invocationCallOrder[0]).toBeLessThan(
    walletSign.mock.invocationCallOrder[0]!
  );
  expect(submitAndAwait).toHaveBeenCalledWith(
    expect.objectContaining({ fee: expect.objectContaining({ maxFee: "100" }) }),
    [{ role: 0, keyType: 1, sig: "0x5167" }],
    undefined
  );
});

it("asks the wallet when this browser has no key", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(null);
  await rate();
  expect(walletSigner).toHaveBeenCalledWith(config, WALLET);
  expect((draftOperation as jest.Mock).mock.calls[0][0]).toMatchObject({
    keyType: 1,
    signer: WALLET,
  });
});

it("refuses past the TDH cap before anything is signed", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(null);
  await expect(rate(151n)).rejects.toMatchObject({
    resultName: "OVER_RATING_BUDGET",
  });
  expect(submitAndAwait).not.toHaveBeenCalled();
});

it("refuses a rating of the rater's own identity", async () => {
  gateway["getIdentityByHandle"]!.mockResolvedValue({ principalId: RATER });
  await expect(rate()).rejects.toMatchObject({ resultName: "SELF_RATING" });
  expect(submitAndAwait).not.toHaveBeenCalled();
});

it("finds the target by its wallets when it has no handle on the chain", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(null);
  (readRating as jest.Mock).mockResolvedValue(null);
  gateway["getIdentityByHandle"]!.mockResolvedValue(null);
  gateway["getIdentityByWallet"]!.mockImplementation(async (wallet: string) =>
    wallet === WALLET
      ? { principalId: RATER, level: { level: 3, tdh: "1000" } }
      : { principalId: TARGET }
  );
  await writeChainRating(config, WALLET, {
    matter: "NIC",
    target: {
      handle: "gone",
      wallets: ["not-a-wallet", `0x${"11".repeat(20)}`],
    },
    category: null,
    value: -4n,
  });
  expect(readRating).toHaveBeenCalledWith(
    RATER,
    2,
    TARGET,
    `0x${"00".repeat(32)}`,
    undefined
  );
  expect((draftOperation as jest.Mock).mock.calls[0][0].body).toMatchObject({
    matter: 2,
    target: TARGET,
    value: "-4",
    priorVersion: "0",
  });
});

it("says so when the rater or the target has no identity", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue(null);
  await expect(rate()).rejects.toMatchObject({
    resultName: "NO_RATER_IDENTITY",
  });
  gateway["getIdentityByWallet"]!.mockResolvedValue({ principalId: RATER });
  gateway["getIdentityByHandle"]!.mockResolvedValue(null);
  await expect(rate()).rejects.toMatchObject({
    resultName: "NO_TARGET_IDENTITY",
  });
  expect(submitAndAwait).not.toHaveBeenCalled();
});

it("doesn't rate the holder of a handle that left the profile's wallets", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(null);
  const PROFILE_WALLET = `0x${"22".repeat(20)}`;
  gateway["getIdentityByHandle"]!.mockResolvedValue({
    principalId: `0x${"0e".repeat(32)}`,
    wallets: [`0x${"33".repeat(20)}`],
  });
  gateway["getIdentityByWallet"]!.mockImplementation(async (wallet: string) =>
    wallet === WALLET
      ? { principalId: RATER, level: { level: 3, tdh: "1000" } }
      : wallet === PROFILE_WALLET
        ? { principalId: TARGET }
        : null
  );
  await writeChainRating(config, WALLET, {
    matter: "NIC",
    target: { handle: "moved_on", wallets: [PROFILE_WALLET] },
    category: null,
    value: 3n,
  });
  expect((draftOperation as jest.Mock).mock.calls[0][0].body).toMatchObject({
    target: TARGET,
  });
});

it("says the identity can't pay the fee before anything is signed", async () => {
  const sign = jest.fn();
  (usableSessionKey as jest.Mock).mockResolvedValue(null);
  (walletSigner as jest.Mock).mockReturnValue({ keyType: 1, sign });
  (readIdentityBalance as jest.Mock).mockResolvedValue(99n);
  await expect(rate()).rejects.toMatchObject({
    resultName: "IDENTITY_FEE_SHORT",
  });
  expect(sign).not.toHaveBeenCalled();
  expect(submitAndAwait).not.toHaveBeenCalled();
});

it("signs and sends once the identity covers the fee", async () => {
  const sign = jest.fn(async () => "0x5151");
  (usableSessionKey as jest.Mock).mockResolvedValue(null);
  (walletSigner as jest.Mock).mockReturnValue({ keyType: 1, sign });
  (readIdentityBalance as jest.Mock).mockResolvedValue(100n);
  await rate();
  expect(sign).toHaveBeenCalled();
  expect(submitAndAwait).toHaveBeenCalledWith(
    expect.objectContaining({ fee: expect.objectContaining({ maxFee: "100" }) }),
    [{ role: 0, keyType: 1, sig: "0x5151" }],
    undefined
  );
});
