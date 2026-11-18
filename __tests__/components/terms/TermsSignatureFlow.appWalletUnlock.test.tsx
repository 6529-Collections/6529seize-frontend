import { decryptData } from "@/components/app-wallets/app-wallet-helpers";
import TermsSignatureFlow from "@/components/terms/TermsSignatureFlow";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { useAppWalletSigningConfirmation } from "@/hooks/useAppWalletSigningConfirmation";
import { createAppWalletConnector } from "@/wagmiConfig/wagmiAppWalletConnector";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Chain, LocalAccount, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

// The real focus trap, as the Terms of Service dialog uses it in the app.
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
const TEST_PASSWORD = "Unlock-Test-1";
const signer = privateKeyToAccount(TEST_PRIVATE_KEY);

let requestPassword: (
  address: string,
  hashed: string
) => Promise<string> = () => Promise.reject(new Error("no unlock dialog"));

function WalletDialogs() {
  const passwordModal = useAppWalletPasswordModal();
  requestPassword = passwordModal.requestPassword;
  const confirmation = useAppWalletSigningConfirmation();
  return (
    <>
      {passwordModal.modal}
      {confirmation}
    </>
  );
}

function createLockedWallet() {
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
    () => requestPassword(signer.address, "hashed")
  );
  return (
    createFn as unknown as (config: unknown) => {
      connect: () => Promise<unknown>;
      getClient: () => Promise<WalletClient>;
    }
  )({ chains: [mainnet], emitter: { emit: jest.fn() } });
}

const originalGetClientRects = HTMLElement.prototype.getClientRects;

beforeAll(() => {
  // jsdom has no layout; report elements as rendered so the real focus trap
  // finds tabbable nodes, as it does in a browser.
  HTMLElement.prototype.getClientRects = function getClientRects() {
    return [{}] as unknown as DOMRectList;
  };
});

afterAll(() => {
  HTMLElement.prototype.getClientRects = originalGetClientRects;
});

beforeEach(() => {
  jest
    .mocked(decryptData)
    .mockImplementation(async (_address, value, password) => {
      if (password !== TEST_PASSWORD) {
        return "";
      }
      return value === "hashed" ? signer.address : TEST_PRIVATE_KEY;
    });
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * Opens the terms dialog and accepts it. Signing first unlocks the wallet,
 * then signs, and holds its result until `finish` is called so the test can
 * inspect the terms dialog while it is still open.
 */
async function acceptTermsWithLockedWallet() {
  let finish: () => void = () => undefined;
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  mockSignDrop.mockImplementation(async () => {
    let result: { success: boolean; signature?: string };
    try {
      const wallet = createLockedWallet();
      await wallet.connect();
      const account = (await wallet.getClient()).account as LocalAccount;
      result = {
        success: true,
        signature: await account.signMessage({ message: "I accept" }),
      };
    } catch {
      result = { success: false };
    }
    await finished;
    return result;
  });

  const onComplete = jest.fn();
  const user = userEvent.setup();
  render(
    <>
      <TermsSignatureFlow />
      <WalletDialogs />
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
  const unlock = await screen.findByRole("dialog", { name: "Unlock Wallet" });
  return { user, unlock, onComplete, finish };
}

function getTermsDialog(): HTMLElement {
  return screen.getByRole("dialog", { name: "Terms of Service" });
}

async function expectTermsTrapActive() {
  // An active trap pulls focus that leaves its dialog back inside it.
  const outside = document.createElement("button");
  document.body.appendChild(outside);
  try {
    act(() => {
      outside.focus();
    });
    await waitFor(() =>
      expect(getTermsDialog()).toContainElement(
        document.activeElement as HTMLElement
      )
    );
  } finally {
    outside.remove();
  }
}

describe("app-wallet unlock and confirmation above a focus-trapped modal", () => {
  it("unlocks, confirms and signs, then restores the terms trap", async () => {
    const { user, unlock, onComplete, finish } =
      await acceptTermsWithLockedWallet();

    const password = within(unlock).getByLabelText("Wallet Password");
    await waitFor(() => expect(password).toHaveFocus());
    await user.type(password, TEST_PASSWORD);
    expect(password).toHaveValue(TEST_PASSWORD);
    await user.click(within(unlock).getByRole("button", { name: "Unlock" }));

    const confirmation = await screen.findByRole("dialog", {
      name: "Sign this message?",
    });
    expect(confirmation).toHaveTextContent("I accept");
    await user.click(
      within(confirmation).getByRole("button", { name: "Sign" })
    );

    await waitFor(() => expect(confirmation).not.toHaveAttribute("open"));
    await expectTermsTrapActive();

    act(() => finish());
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        signature: expect.stringMatching(/^0x/),
      })
    );
  });

  it("submits the password with Enter inside the unlock dialog", async () => {
    const { user, unlock, finish, onComplete } =
      await acceptTermsWithLockedWallet();

    await user.type(
      within(unlock).getByLabelText("Wallet Password"),
      `${TEST_PASSWORD}{Enter}`
    );

    const confirmation = await screen.findByRole("dialog", {
      name: "Sign this message?",
    });
    await user.click(
      within(confirmation).getByRole("button", { name: "Cancel" })
    );
    act(() => finish());
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith({ success: false });
  });

  it("restores the terms trap when unlocking is cancelled", async () => {
    const { user, unlock, onComplete, finish } =
      await acceptTermsWithLockedWallet();

    await user.click(within(unlock).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(unlock).not.toHaveAttribute("open"));
    expect(
      screen.queryByRole("dialog", { name: "Sign this message?" })
    ).toBeNull();
    await expectTermsTrapActive();

    act(() => finish());
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith({ success: false });
  });
});
