import {
  __resetDesktopBrowserWalletForTests,
  desktopWalletSendsTransactions,
  getDesktopWalletMethods,
  getDesktopWalletRequestStatus,
  runDesktopWalletRequest,
  showDesktopWalletTransactionRefusal,
  watchDesktopWalletStatus,
} from "@/services/desktop/desktopBrowserWallet";
import { getDesktopShellApi, getDesktopWallet } from "@/helpers/desktop-shell";
import { walletTransactionRulesHash } from "@/lib/desktop/wallet-transactions";

jest.mock("@/helpers/desktop-shell", () => ({
  getDesktopShellApi: jest.fn(),
  getDesktopStore: jest.fn(() => null),
  getDesktopWallet: jest.fn(),
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";
const HASH = `0x${"cd".repeat(32)}`;
const TRANSACTION = {
  method: "eth_sendTransaction",
  params: [
    {
      from: ADDRESS,
      to: "0xcaac2b43b1b40edbfaddb5aebde9a90a27e1a3be",
      data: "0x",
      value: "0x1",
    },
  ],
  address: ADDRESS,
  chainId: 11_155_111,
};

let lateListener: ((event: unknown) => void) | null = null;
let statusListener: ((status: unknown) => void) | null = null;
const bridge = {
  request: jest.fn(),
  cancel: jest.fn(),
  reopen: jest.fn(),
  status: jest.fn(),
  capabilities: jest.fn(),
  onStatusChange: jest.fn((callback: (status: unknown) => void) => {
    statusListener = callback;
    return () => {
      statusListener = null;
    };
  }),
  onLateTransaction: jest.fn((callback: (event: unknown) => void) => {
    lateListener = callback;
    return () => {
      lateListener = null;
    };
  }),
};
const api = { getInfo: jest.fn() };

describe("desktopBrowserWallet: transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetDesktopBrowserWalletForTests();
    jest.mocked(getDesktopWallet).mockReturnValue(bridge);
    jest.mocked(getDesktopShellApi).mockReturnValue(api as never);
    api.getInfo.mockResolvedValue({ supportsWalletForwarding: true });
    bridge.status.mockResolvedValue({ pending: false });
  });

  it("sends transactions only with this website's rules", async () => {
    bridge.capabilities.mockResolvedValue({
      version: 1,
      methods: ["personal_sign", "eth_sendTransaction"],
      transactionRules: walletTransactionRulesHash(),
    });
    await expect(getDesktopWalletMethods()).resolves.toEqual([
      "personal_sign",
      "eth_sendTransaction",
    ]);
    expect(desktopWalletSendsTransactions()).toBe(true);

    bridge.capabilities.mockResolvedValue({
      version: 1,
      methods: ["personal_sign", "eth_sendTransaction"],
      transactionRules: "0".repeat(64),
    });
    await expect(getDesktopWalletMethods()).resolves.toEqual(["personal_sign"]);
    expect(desktopWalletSendsTransactions()).toBe(false);
  });

  it("asks for an update when this 6529 Desktop sends no transactions", async () => {
    bridge.capabilities.mockResolvedValue({ version: 1, methods: [] });
    await getDesktopWalletMethods();
    showDesktopWalletTransactionRefusal();
    expect(getDesktopWalletRequestStatus()).toEqual({
      kind: "transactionUpdate",
    });
  });

  it("returns the hash of a confirmed transaction", async () => {
    bridge.request.mockResolvedValue({ ok: true, value: HASH });
    await expect(runDesktopWalletRequest(TRANSACTION)).resolves.toEqual({
      ok: true,
      value: HASH,
    });
    expect(getDesktopWalletRequestStatus()).toEqual({ kind: "idle" });
  });

  it("refuses a signature as the answer to a transaction", async () => {
    bridge.request.mockResolvedValue({
      ok: true,
      value: `0x${"ab".repeat(65)}`,
    });
    await expect(runDesktopWalletRequest(TRANSACTION)).resolves.toEqual({
      ok: false,
      code: "failed",
    });
  });

  it.each([
    ["unverified", "transaction-not-visible", "transactionUnverified"],
    ["unverified", "rpc-unavailable", "transactionUnverified"],
    ["failed", "transaction-mismatch", "transactionMismatch"],
  ])(
    "shows a %s / %s transaction with its hash",
    async (code, reason, kind) => {
      bridge.request.mockResolvedValue({
        ok: false,
        code,
        reason,
        transactionHash: HASH,
      });
      await runDesktopWalletRequest(TRANSACTION);
      expect(getDesktopWalletRequestStatus()).toEqual({
        kind,
        hash: HASH,
        chainId: 11_155_111,
      });
    }
  );

  it.each([
    ["failed", "transaction-not-visible"],
    ["failed", undefined],
    ["expired", undefined],
    ["cancelled", undefined],
    ["unverified", undefined],
    ["refused", "transaction-rule"],
  ])("never hides a reported hash (%s / %s)", async (code, reason) => {
    bridge.request.mockResolvedValue({
      ok: false,
      code,
      ...(reason === undefined ? {} : { reason }),
      transactionHash: HASH,
    });
    await runDesktopWalletRequest(TRANSACTION);
    expect(getDesktopWalletRequestStatus()).toEqual({
      kind: "transactionUnverified",
      hash: HASH,
      chainId: 11_155_111,
    });
  });

  it("explains a transaction the shell refuses by its rules", async () => {
    bridge.request.mockResolvedValue({
      ok: false,
      code: "refused",
      reason: "transaction-rule",
    });
    await runDesktopWalletRequest(TRANSACTION);
    expect(getDesktopWalletRequestStatus()).toEqual({ kind: "transaction" });
  });

  it("marks an open transaction request and reports late transactions", async () => {
    watchDesktopWalletStatus();
    statusListener?.({
      pending: true,
      code: "ABC-123",
      method: "eth_sendTransaction",
      expiresAt: 1_800_000_000_000,
    });
    expect(getDesktopWalletRequestStatus()).toMatchObject({
      kind: "waiting",
      transaction: true,
    });
    // Never hides an open request.
    lateListener?.({ ok: true, value: HASH, chainId: 1 });
    expect(getDesktopWalletRequestStatus()).toMatchObject({ kind: "waiting" });

    statusListener?.({ pending: false });
    lateListener?.({ ok: true, value: HASH, chainId: 1 });
    expect(getDesktopWalletRequestStatus()).toEqual({
      kind: "lateTransaction",
      hash: HASH,
      chainId: 1,
    });
    lateListener?.({
      ok: false,
      code: "unverified",
      reason: "rpc-unavailable",
      transactionHash: HASH,
      chainId: 11_155_111,
    });
    expect(getDesktopWalletRequestStatus()).toEqual({
      kind: "lateTransaction",
      hash: HASH,
      chainId: 11_155_111,
    });
  });

  it("ignores malformed late events", () => {
    watchDesktopWalletStatus();
    for (const event of [
      null,
      { ok: true, value: "0x12", chainId: 1 },
      { ok: true, value: HASH },
      { ok: false, chainId: 1 },
    ]) {
      lateListener?.(event);
      lateListener?.({ ok: true, value: HASH, chainId: 5 });
    }
    expect(getDesktopWalletRequestStatus()).toEqual({ kind: "idle" });
  });
});
