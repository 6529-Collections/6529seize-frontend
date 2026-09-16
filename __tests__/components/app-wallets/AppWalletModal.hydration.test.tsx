import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { UnlockAppWalletModal } from "@/components/app-wallets/AppWalletModal";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ setError: jest.fn() }),
}));

it.each([false, true])(
  "hydrates an initially open=%s wallet portal without replacing page content",
  async (show) => {
    const element = (
      <>
        <h1>Public reading</h1>
        <UnlockAppWalletModal
          show={show}
          address=""
          address_hashed=""
          onUnlock={jest.fn()}
          onHide={jest.fn()}
        />
      </>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.appendChild(container);
    const heading = container.querySelector("h1");
    expect(container.querySelector("dialog")).toBeNull();
    const onRecoverableError = jest.fn();
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, element, { onRecoverableError });
      });
      expect(container.querySelector("h1")).toBe(heading);
      expect(document.querySelector("dialog")?.open).toBe(show);
      expect(onRecoverableError).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  }
);
