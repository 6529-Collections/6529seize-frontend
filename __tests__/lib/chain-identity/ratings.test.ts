import type { Config } from "wagmi";
import { repCategoryId } from "@/lib/chain/codec/ids";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { runOperation } from "@/lib/chain-identity/operation";
import { writeChainRating } from "@/lib/chain-identity/ratings";
import { usableSessionKey } from "@/lib/chain-identity/session";
import { sessionSigner, walletSigner } from "@/lib/chain-identity/signers";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: {
    getIdentityByWallet: jest.fn(),
    getIdentityByHandle: jest.fn(),
    getRatingsByRater: jest.fn(),
  },
}));
jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  runOperation: jest.fn(async () => ({ draft: {}, status: {} })),
}));
jest.mock("@/lib/chain-identity/session", () => ({
  usableSessionKey: jest.fn(),
}));
jest.mock("@/lib/chain-identity/signers", () => ({
  sessionSigner: jest.fn(() => ({ keyType: 2, sign: jest.fn() })),
  walletSigner: jest.fn(() => ({ keyType: 1, sign: jest.fn() })),
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const RATER = `0x${"0a".repeat(32)}`;
const TARGET = `0x${"0b".repeat(32)}`;
const WALLET = "0x00000000000000000000000000000000000000aa" as const;
const config = {} as Config;
const key = {
  principalId: RATER,
  keyId: `0x${"0c".repeat(32)}`,
  grantId: `0x${"0d".repeat(32)}`,
  expiresAtMs: Number.MAX_SAFE_INTEGER,
};

beforeEach(() => {
  jest.clearAllMocks();
  gateway["getIdentityByWallet"]!.mockImplementation(async (wallet: string) =>
    wallet === WALLET ? { principalId: RATER } : null
  );
  gateway["getIdentityByHandle"]!.mockResolvedValue({ principalId: TARGET });
  gateway["getRatingsByRater"]!.mockResolvedValue([
    {
      target: TARGET,
      category: { id: repCategoryId("Art"), name: "art" },
      updatedHeight: 77,
    },
  ]);
});

const rate = () =>
  writeChainRating(config, WALLET, {
    matter: "REP",
    target: { handle: "punk", wallets: [] },
    category: "Art",
    value: 12n,
  });

it("rates with this browser's key, no wallet prompt, at the current version", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(key);
  await rate();
  expect(sessionSigner).toHaveBeenCalledWith(key);
  expect(walletSigner).not.toHaveBeenCalled();
  const [request, primaryType] = (runOperation as jest.Mock).mock.calls[0];
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
      value: "12",
      priorVersion: "77",
    },
  });
});

it("asks the wallet when this browser has no key", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(null);
  await rate();
  expect(walletSigner).toHaveBeenCalledWith(config, WALLET);
  expect((runOperation as jest.Mock).mock.calls[0][0]).toMatchObject({
    keyType: 1,
    signer: WALLET,
  });
});

it("finds the target by its wallets when it has no handle on the chain", async () => {
  (usableSessionKey as jest.Mock).mockResolvedValue(null);
  gateway["getRatingsByRater"]!.mockResolvedValue([]);
  gateway["getIdentityByHandle"]!.mockResolvedValue(null);
  gateway["getIdentityByWallet"]!.mockImplementation(async (wallet: string) =>
    wallet === WALLET ? { principalId: RATER } : { principalId: TARGET }
  );
  await writeChainRating(config, WALLET, {
    matter: "NIC",
    target: { handle: "gone", wallets: ["not-a-wallet", `0x${"11".repeat(20)}`] },
    category: null,
    value: -4n,
  });
  expect((runOperation as jest.Mock).mock.calls[0][0].body).toMatchObject({
    matter: 2,
    target: TARGET,
    value: "-4",
    priorVersion: "0",
  });
});

it("says so when the rater or the target has no identity", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue(null);
  await expect(rate()).rejects.toThrow(
    "This wallet has no identity on the 6529 Network yet."
  );
  gateway["getIdentityByWallet"]!.mockResolvedValue({ principalId: RATER });
  gateway["getIdentityByHandle"]!.mockResolvedValue(null);
  await expect(rate()).rejects.toThrow(
    "This profile has no identity on the 6529 Network yet."
  );
  expect(runOperation).not.toHaveBeenCalled();
});
