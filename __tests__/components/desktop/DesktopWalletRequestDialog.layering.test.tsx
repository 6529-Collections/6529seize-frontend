import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopWalletRequestDialog from "@/components/desktop/DesktopWalletRequestDialog";
import TermsSignatureFlow from "@/components/terms/TermsSignatureFlow";
import type { getDesktopWalletRequestStatus } from "@/services/desktop/desktopBrowserWallet";

// The real focus trap: it cancels clicks outside its container and handles
// Escape, which is exactly what the wallet request dialog must stay above.
jest.unmock("focus-trap-react");

type DesktopWalletRequestStatus = ReturnType<
  typeof getDesktopWalletRequestStatus
>;

let status: DesktopWalletRequestStatus = { kind: "idle" };
const listeners = new Set<() => void>();
const cancel = jest.fn();
const reopen = jest.fn();

jest.mock("@/services/desktop/desktopBrowserWallet", () => ({
  getDesktopWalletRequestStatus: () => status,
  getServerDesktopWalletRequestStatus: () => ({ kind: "idle" }),
  subscribeDesktopWalletRequestStatus: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  cancelDesktopWalletRequest: () => cancel(),
  reopenDesktopWalletRequest: () => reopen(),
  dismissDesktopWalletRequestStatus: jest.fn(),
}));
jest.mock("@/services/desktop/continueInBrowser", () => ({
  continueInBrowser: () => true,
  getWebsiteHost: () => "6529.io",
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/hooks/drops/useDropSignature", () => ({
  useDropSignature: () => ({ signDrop: jest.fn(), isLoading: false }),
}));

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

afterEach(() => {
  jest.clearAllMocks();
  status = { kind: "idle" };
  listeners.clear();
});

/** The drop flow's Terms of Service modal is open when the request starts. */
async function openRequestOverTerms() {
  const user = userEvent.setup();
  render(
    <>
      <TermsSignatureFlow />
      <DesktopWalletRequestDialog />
    </>
  );
  act(() => {
    document.dispatchEvent(
      new CustomEvent("showTermsModal", {
        detail: {
          drop: { parts: [] },
          termsOfService: "Terms text",
          onComplete: jest.fn(),
        },
      })
    );
  });
  const terms = await screen.findByRole("dialog", { name: "Terms of Service" });
  // The terms modal's focus trap is active and holds focus.
  await waitFor(() =>
    expect(terms).toContainElement(document.activeElement as HTMLElement)
  );
  status = {
    kind: "waiting",
    requestCode: "9E0-CA6",
    expiresAt: Date.now() + 120_000,
    fingerprint: "2c26b46b…6266e7ae",
  };
  act(() => listeners.forEach((listener) => listener()));
  const request = await screen.findByRole("dialog", {
    name: "Signature request",
  });
  return { user, terms, request };
}

describe("wallet request dialog above the Terms of Service modal", () => {
  it("is the top modal layer and takes focus from the terms modal", async () => {
    const { request, terms } = await openRequestOverTerms();

    expect(request).toHaveAttribute("data-modal-layer", "top");
    expect(within(request).getByText(/9E0-CA6/)).toBeInTheDocument();
    await waitFor(() =>
      expect(request).toContainElement(document.activeElement as HTMLElement)
    );
    expect(terms).not.toContainElement(document.activeElement as HTMLElement);
  });

  it("cancels when Cancel is clicked while the terms modal is open", async () => {
    const { user, request } = await openRequestOverTerms();

    await user.click(within(request).getByRole("button", { name: "Cancel" }));

    expect(cancel).toHaveBeenCalledTimes(1);
    // The terms modal is still there underneath.
    expect(
      screen.getByRole("dialog", { name: "Terms of Service" })
    ).toBeInTheDocument();
  });

  it("reaches its controls by keyboard and reopens the page", async () => {
    const { user, request } = await openRequestOverTerms();

    const reopenButton = within(request).getByRole("button", {
      name: "Open the page again",
    });
    for (let step = 0; step < 6; step += 1) {
      if (document.activeElement === reopenButton) break;
      await user.tab();
      // Focus never leaves the request dialog for the terms modal.
      expect(request).toContainElement(document.activeElement as HTMLElement);
    }
    expect(reopenButton).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(reopen).toHaveBeenCalledTimes(1);
  });

  it("closes only itself on Escape: the request is cancelled, the terms stay", async () => {
    const { user } = await openRequestOverTerms();

    await user.keyboard("{Escape}");

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("dialog", { name: "Terms of Service" })
    ).toBeInTheDocument();
  });
});
