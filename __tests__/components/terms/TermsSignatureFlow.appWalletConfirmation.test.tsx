import { decryptData } from "@/components/app-wallets/app-wallet-helpers";
import TermsSignatureFlow from "@/components/terms/TermsSignatureFlow";
import { useAppWalletSigningConfirmation } from "@/hooks/useAppWalletSigningConfirmation";
import { createAppWalletConnector } from "@/wagmiConfig/wagmiAppWalletConnector";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Chain, LocalAccount, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

// The real focus trap: it cancels clicks outside its container and handles
// Escape, which is exactly what the confirmation dialog must stay above.
jest.unmock("focus-trap-react");

jest.mock("@/components/app-wallets/app-wallet-helpers", () => ({
  decryptData: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ setError: jest.fn() }),
}));

const mockSignDrop = jest.fn();
jest.mock("@/hooks/drops/useDropSignature", () => ({
  useDropSignature: () => ({ signDrop: mockSignDrop, isLoading: false }),
}));

// A well-known local development key; it never holds real funds.
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const signer = privateKeyToAccount(TEST_PRIVATE_KEY);

async function connectAppWallet(): Promise<LocalAccount> {
  jest
    .mocked(decryptData)
    .mockImplementation(async (_address, value) =>
      value === "hashed" ? signer.address : TEST_PRIVATE_KEY
    );
  const createFn = createAppWalletConnector(
    [mainnet as Chain],
    {
      appWallet: {
        address: signer.address,
        address_hashed: "hashed",
        private_key: "encrypted",
        name: "Test Wallet",
      } as Parameters<typeof createAppWalletConnector>[1]["appWallet"],
    },
    () => Promise.resolve("password")
  );
  const instance = (
    createFn as unknown as (config: unknown) => {
      connect: () => Promise<unknown>;
      getClient: () => Promise<WalletClient>;
    }
  )({ chains: [mainnet], emitter: { emit: jest.fn() } });
  await instance.connect();
  return (await instance.getClient()).account as LocalAccount;
}

function ConfirmationHost() {
  return useAppWalletSigningConfirmation();
}

const originalGetClientRects = HTMLElement.prototype.getClientRects;

beforeAll(() => {
  // jsdom has no layout; report every element as rendered so the real focus
  // trap finds tabbable nodes, as it does in a browser.
  HTMLElement.prototype.getClientRects = function getClientRects() {
    return [{}] as unknown as DOMRectList;
  };
});

afterAll(() => {
  HTMLElement.prototype.getClientRects = originalGetClientRects;
});

async function openTermsAndAccept() {
  const account = await connectAppWallet();
  mockSignDrop.mockImplementation(async () => {
    try {
      const signature = await account.signMessage({
        message: "I accept the terms",
      });
      return { success: true, signature };
    } catch {
      return { success: false };
    }
  });
  const onComplete = jest.fn();
  const user = userEvent.setup();
  render(
    <>
      <TermsSignatureFlow />
      <ConfirmationHost />
    </>
  );
  act(() => {
    document.dispatchEvent(
      new CustomEvent("showTermsModal", {
        detail: {
          drop: { parts: [] },
          termsOfService: "Terms text",
          onComplete,
        },
      })
    );
  });
  await user.click(
    await screen.findByRole("checkbox", {
      name: "Agree to terms of service checkbox",
    })
  );
  await user.click(screen.getByRole("button", { name: "Agree & Continue" }));
  const confirmation = await screen.findByRole("dialog", {
    name: "Sign this message?",
  });
  expect(confirmation).toHaveTextContent("I accept the terms");
  return { user, confirmation, onComplete };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("app-wallet confirmation above a focus-trapped modal", () => {
  it("signs when Sign is clicked inside the trapped terms flow", async () => {
    const { user, confirmation, onComplete } = await openTermsAndAccept();

    await user.click(
      within(confirmation).getByRole("button", { name: "Sign" })
    );

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        signature: expect.stringMatching(/^0x/),
      })
    );
  });

  it("cancels when Cancel is clicked inside the trapped terms flow", async () => {
    const { user, confirmation, onComplete } = await openTermsAndAccept();

    await user.click(
      within(confirmation).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith({ success: false });
  });

  it("closes only the confirmation on Escape and completes once", async () => {
    const { user, confirmation, onComplete } = await openTermsAndAccept();

    expect(confirmation).toContainElement(
      document.activeElement as HTMLElement
    );
    await user.keyboard("{Escape}");

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith({ success: false });
    // The terms modal's own Escape handler did not also reject it.
    await act(async () => {
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
