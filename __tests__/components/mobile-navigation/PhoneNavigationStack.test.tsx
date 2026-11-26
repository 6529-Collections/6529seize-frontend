import { render } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import PhoneNavigationStack from "@/components/mobile-navigation/PhoneNavigationStack";
import type { PhoneNavigationRoute } from "@/helpers/waves/phone-navigation-route";

jest.mock("next/dynamic", () => () => () => null);
jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useSearchParams: jest.fn(),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef: jest.fn() }),
  PhoneListLayoutProvider: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/components/navigation/BottomNavigation", () => () => null);
jest.mock("@/components/header/HeaderPlaceholder", () => () => null);
jest.mock("@/components/providers/PullToRefresh", () => () => null);
jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: () => ({ isVisible: false }),
}));
jest.mock("@/contexts/EditingDropContext", () => ({
  useEditingDrop: () => ({ editingDropId: null }),
}));
jest.mock("@/lib/motion/phone-navigation", () => ({
  createPhoneNavigationMotion: () => ({ commit: jest.fn() }),
}));
jest.mock("@/lib/motion/phone-navigation-registry", () => ({
  registerPhoneNavigationMotion: () => () => undefined,
}));

beforeEach(() => {
  jest.mocked(useSearchParams).mockReturnValue(new ReadonlyURLSearchParams(""));
});

it.each([
  ["waves", "feed"],
  ["messages", "encrypted"],
] as const)(
  "retains the same %s and %s lists through StrictMode navigation",
  (family, nested) => {
    const view = (route: PhoneNavigationRoute) => (
      <StrictMode>
        <PhoneNavigationStack route={route}>
          <p>Conversation</p>
        </PhoneNavigationStack>
      </StrictMode>
    );
    const root: PhoneNavigationRoute = {
      screen: family,
      destination: null,
      family,
    };
    const { container, rerender } = render(view(root));
    const list = container.querySelector<HTMLElement>(
      `[data-phone-navigation-screen="${family}"]`
    );
    if (!list) throw new Error("Expected the root list");
    list.scrollTop = 850;

    rerender(view({ screen: "conversation", destination: family, family }));
    expect(list).toHaveAttribute("aria-hidden", "true");
    expect(list).toHaveAttribute("inert");
    expect(list.isConnected).toBe(true);

    rerender(view({ screen: nested, destination: family, family }));
    const nestedList = container.querySelector(
      `[data-phone-navigation-screen="${nested}"]`
    );
    expect(nestedList).toHaveAttribute("aria-hidden", "false");
    rerender(view({ screen: "conversation", destination: nested, family }));
    expect(nestedList).toHaveAttribute("inert");
    expect(nestedList?.isConnected).toBe(true);

    rerender(view(root));
    expect(list).toHaveAttribute("aria-hidden", "false");
    expect(list).not.toHaveAttribute("inert");
    expect(list.scrollTop).toBe(850);
    expect(
      container.querySelector(`[data-phone-navigation-screen="${family}"]`)
    ).toBe(list);
    expect(
      container.querySelectorAll("[data-phone-navigation-screen]")
    ).toHaveLength(2);
  }
);
