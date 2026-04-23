import React from "react";
import { render, renderHook } from "@testing-library/react";
import {
  ViewProvider,
  useViewContext,
} from "@/components/navigation/ViewContext";
import { useRouter } from "next/navigation";

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
  useRouter.mockReturnValue({
    push,
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

  it("navigates to home (latest) when Home is clicked", () => {
    render(
      <ViewProvider>
        <TestNavComponent
          item={
            {
              kind: "route",
              name: "Home",
              href: "/",
              icon: "home",
            } as NavItem
          }
        />
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/");
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
