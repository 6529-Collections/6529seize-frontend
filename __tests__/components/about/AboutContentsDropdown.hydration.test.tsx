import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import { AboutSection } from "@/types/enums";
import { act, fireEvent, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported: false }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ spaces: { headerSpace: 0 } }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useOptionalCookieConsent: () => undefined,
}));
jest.mock("@/contexts/HeaderContext", () => ({
  useOptionalHeaderContext: () => undefined,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: false, isCapacitor: false }),
}));

// Keep the real hydration hook, Headless UI trigger, and menu rendering.
test("server-rendered About navigation stays disabled until its first click can open the menu", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root | undefined;
  const tree = (
    <AboutContentsDropdown currentSection={AboutSection.SUBSCRIPTIONS} />
  );
  try {
    container.innerHTML = renderToString(tree);
    const trigger = screen.getByRole("button", {
      name: /Open About contents navigation/,
    });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await act(async () => {
      root = hydrateRoot(container, tree);
    });
    const readyTrigger = screen.getByRole("button", {
      name: /Open About contents navigation/,
    });
    expect(readyTrigger).toBeEnabled();
    fireEvent.click(readyTrigger);
    expect(await screen.findByRole("menu")).toBeVisible();
    expect(readyTrigger).toHaveAttribute("aria-expanded", "true");
  } finally {
    await act(async () => {
      root?.unmount();
    });
    container.remove();
  }
});
