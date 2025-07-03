import {
  createAppWalletConnector,
  APP_WALLET_CONNECTOR_TYPE,
} from "../../wagmiConfig/wagmiAppWalletConnector";
import type { AppWallet } from "../../components/app-wallets/AppWalletsContext";

// Mock dependencies
jest.mock("wagmi", () => ({
  createConnector: jest.fn((factory) =>
    factory({ emitter: { emit: jest.fn() } })
  ),
}));

jest.mock("viem/accounts", () => ({
  privateKeyToAccount: jest.fn(),
}));

jest.mock("viem", () => ({
  createWalletClient: jest.fn(),
  fallback: jest.fn(),
  http: jest.fn(),
}));

jest.mock("../../components/app-wallets/app-wallet-helpers", () => ({
  decryptData: jest.fn(),
}));

jest.mock("../../wagmiConfig/wagmiConfig", () => ({
  getChains: jest.fn(),
}));

jest.mock("../../helpers/Helpers", () => ({
  areEqualAddresses: jest.fn(),
}));

// Import mocked modules
import { createConnector } from "wagmi";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, fallback, http } from "viem";
import { decryptData } from "../../components/app-wallets/app-wallet-helpers";
import { getChains } from "../../wagmiConfig/wagmiConfig";
import { areEqualAddresses } from "../../helpers/Helpers";
import { mainnet, polygon } from "viem/chains";

const mockCreateConnector = createConnector as jest.MockedFunction<
  typeof createConnector
>;
const mockPrivateKeyToAccount = privateKeyToAccount as jest.MockedFunction<
  typeof privateKeyToAccount
>;
const mockCreateWalletClient = createWalletClient as jest.MockedFunction<
  typeof createWalletClient
>;
const mockFallback = fallback as jest.MockedFunction<typeof fallback>;
const mockHttp = http as jest.MockedFunction<typeof http>;
const mockDecryptData = decryptData as jest.MockedFunction<typeof decryptData>;
const mockGetChains = getChains as jest.MockedFunction<typeof getChains>;
const mockAreEqualAddresses = areEqualAddresses as jest.MockedFunction<
  typeof areEqualAddresses
>;

describe("wagmiAppWalletConnector", () => {
  const mockAppWallet: AppWallet = {
    address: "0x123456789abcdef",
    name: "Test Wallet",
    address_hashed: "hashed_address",
    private_key: "encrypted_private_key",
    created_at: Date.now(),
    mnemonic: "mnemonic",
    imported: false,
  };

  const mockChains = [mainnet, polygon];

  const mockRequestPasswordModal = jest.fn();
  const mockEmitter = {
    emit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetChains.mockReturnValue(mockChains);
    mockCreateConnector.mockImplementation((factory) =>
      factory({ emitter: mockEmitter })
    );
    mockFallback.mockReturnValue({} as any);
    mockHttp.mockReturnValue({} as any);
    mockAreEqualAddresses.mockReturnValue(true);
    mockDecryptData.mockResolvedValue("decrypted_value");

    const mockAccount = { address: mockAppWallet.address };
    mockPrivateKeyToAccount.mockReturnValue(mockAccount as any);

    const mockWalletClient = { account: mockAccount };
    mockCreateWalletClient.mockReturnValue(mockWalletClient as any);
  });

  describe("createAppWalletConnector", () => {
    it("creates connector with correct properties", () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      expect(connector.icon).toBe(
        `https://robohash.org/${mockAppWallet.address}.png`
      );
      expect(connector.id).toBe(mockAppWallet.address);
      expect(connector.name).toBe(mockAppWallet.name);
      expect(connector.type).toBe(APP_WALLET_CONNECTOR_TYPE);
      expect(connector.supportsSimulation).toBe(false);
    });

    it("sets password successfully with valid credentials", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address) // First call for address verification
        .mockResolvedValueOnce("private_key_decrypted"); // Second call for private key

      const result = await connector.setPassword("correct_password");

      expect(result).toBe(true);
      expect(mockDecryptData).toHaveBeenCalledTimes(2);
      expect(mockDecryptData).toHaveBeenNthCalledWith(
        1,
        mockAppWallet.address,
        mockAppWallet.address_hashed,
        "correct_password"
      );
      expect(mockDecryptData).toHaveBeenNthCalledWith(
        2,
        mockAppWallet.address,
        mockAppWallet.private_key,
        "correct_password"
      );
    });

    it("fails password validation with invalid credentials", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockAreEqualAddresses.mockReturnValue(false);

      const result = await connector.setPassword("wrong_password");

      expect(result).toBe(false);
    });

    it("handles decryption errors gracefully", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockDecryptData.mockRejectedValue(new Error("Decryption failed"));

      const result = await connector.setPassword("any_password");

      expect(result).toBe(false);
    });

    it("connects successfully with valid password", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockRequestPasswordModal.mockResolvedValue("correct_password");
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("private_key_decrypted");

      const result = await connector.connect({ chainId: 1 });

      expect(result).toEqual({
        accounts: [mockAppWallet.address],
        chainId: 1,
      });
      expect(mockEmitter.emit).toHaveBeenCalledWith("connect", {
        accounts: [mockAppWallet.address],
        chainId: 1,
      });
    });

    it("uses default chain ID when none provided", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockRequestPasswordModal.mockResolvedValue("correct_password");
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("private_key_decrypted");

      const result = await connector.connect();

      expect(result.chainId).toBe(mockChains[0].id);
    });

    it("throws error when no val  id account found after decryption", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockRequestPasswordModal.mockResolvedValue("correct_password");
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("private_key_decrypted");

      mockCreateWalletClient.mockReturnValue({ account: null } as any);

      await expect(connector.connect()).rejects.toThrow(
        "No valid local account found after decryption."
      );
    });

    it("disconnects properly", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      await connector.disconnect();

      expect(mockEmitter.emit).toHaveBeenCalledWith("disconnect");
    });

    it("gets accounts after connection", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      // First connect
      mockRequestPasswordModal.mockResolvedValue("correct_password");
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("private_key_decrypted");

      await connector.connect();

      const accounts = await connector.getAccounts();
      expect(accounts).toEqual([mockAppWallet.address]);
    });

    it("returns empty accounts when no decrypted key", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      // Try to get accounts without setting password first
      try {
        await connector.getAccounts();
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toBe(
          "No decrypted key found. Call connect() first."
        );
      }
    });

    it("gets current chain ID", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      const chainId = await connector.getChainId();
      expect(chainId).toBe(mockChains[0].id);
    });

    it("checks authorization status", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      // Initially not authorized
      let isAuthorized = await connector.isAuthorized();
      expect(isAuthorized).toBe(false);

      // After setting password
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("private_key_decrypted");

      await connector.setPassword("correct_password");
      isAuthorized = await connector.isAuthorized();
      expect(isAuthorized).toBe(true);
    });

    it("switches chain successfully", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      // First connect
      mockRequestPasswordModal.mockResolvedValue("correct_password");
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("private_key_decrypted");

      await connector.connect();

      const newChain = await connector.switchChain({ chainId: 137 });

      expect(newChain).toEqual(mockChains[1]);
      expect(mockEmitter.emit).toHaveBeenCalledWith("change", { chainId: 137 });
    });

    it("throws error when switching to unknown chain", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      await expect(connector.switchChain({ chainId: 999 })).rejects.toThrow(
        "Chain with id 999 not found!"
      );
    });

    it("handles ensureHexPrefix correctly", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockRequestPasswordModal.mockResolvedValue("correct_password");
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("123456"); // Without 0x prefix

      await connector.connect();

      expect(mockPrivateKeyToAccount).toHaveBeenCalledWith("0x123456");
    });

    it("preserves hex prefix when already present", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockRequestPasswordModal.mockResolvedValue("correct_password");
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("0x123456"); // With 0x prefix

      await connector.connect();

      expect(mockPrivateKeyToAccount).toHaveBeenCalledWith("0x123456");
    });

    it("handles event listeners correctly", () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      const accounts = ["0xnew_account"];
      connector.onAccountsChanged(accounts);
      expect(mockEmitter.emit).toHaveBeenCalledWith("change", { accounts });

      const hexChainId = "0x89"; // 137 in hex
      connector.onChainChanged(hexChainId);
      expect(mockEmitter.emit).toHaveBeenCalledWith("change", { chainId: 137 });

      connector.onConnect({});
      expect(mockEmitter.emit).toHaveBeenCalledWith("connect", {
        accounts: [],
        chainId: mockChains[0].id,
      });

      connector.onDisconnect(new Error("test"));
      expect(mockEmitter.emit).toHaveBeenCalledWith("disconnect");

      const message = { type: "test" };
      connector.onMessage(message);
      expect(mockEmitter.emit).toHaveBeenCalledWith("message", message);
    });

    it("gets provider and client", async () => {
      const connector = createAppWalletConnector(
        mockChains,
        { appWallet: mockAppWallet },
        mockRequestPasswordModal
      );

      mockRequestPasswordModal.mockResolvedValue("correct_password");
      mockDecryptData
        .mockResolvedValueOnce(mockAppWallet.address)
        .mockResolvedValueOnce("private_key_decrypted");

      await connector.connect();

      const provider = await connector.getProvider();
      const client = await connector.getClient();

      expect(provider).toBeDefined();
      expect(client).toBeDefined();
      expect(provider).toBe(client);
    });
  });
});
