import React from "react";
import { render, renderHook } from "@testing-library/react";
import {
  ViewProvider,
  useViewContext,
} from "@/components/navigation/ViewContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isApp: false,
    isMobileDevice: false,
    hasTouchScreen: false,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const push = jest.fn();

type ViewContextValue = ReturnType<typeof useViewContext>;

const TestNavComponent: React.FC<{
  readonly item: NavItem;
  readonly afterNav?:
    | ((context: ViewContextValue) => void)
    | undefined
    | undefined;
}> = ({ item, afterNav }) => {
  const context = useViewContext();

  React.useEffect(() => {
    context.handleNavClick(item);
    if (afterNav) {
      afterNav(context);
    }
  }, [context, item, afterNav]);

  return null;
};

beforeEach(() => {
  jest.clearAllMocks();
  usePathname.mockReturnValue("/");
  useRouter.mockReturnValue({
    push,
  });
  useSearchParams.mockReturnValue({
    get: jest.fn(),
  });
});

describe("ViewContext", () => {
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useViewContext())).toThrow(
      "useViewContext must be used within a ViewProvider"
    );
  });

  it("handles route navigation", () => {
    render(
      <ViewProvider>
        <TestNavComponent
          item={
            {
              kind: "route",
              name: "Home",
              href: "/home",
              icon: "h",
            } as NavItem
          }
        />
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("navigates to feed tab when Stream is clicked", () => {
    render(
      <ViewProvider>
        <TestNavComponent
          item={
            {
              kind: "route",
              name: "Stream",
              href: "/",
              icon: "s",
            } as NavItem
          }
        />
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/?tab=feed");
  });

  it("navigates to waves view when no last visited wave", () => {
    render(
      <ViewProvider>
        <TestNavComponent
          item={
            {
              kind: "view",
              name: "Waves",
              viewKey: "waves",
              icon: "w",
            } as NavItem
          }
          afterNav={({ hardBack }) => hardBack("waves")}
        />
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/waves");
    expect(push).toHaveBeenLastCalledWith("/waves");
  });
});
