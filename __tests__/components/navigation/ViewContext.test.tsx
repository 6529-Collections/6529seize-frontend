import React from "react";
import { render, renderHook } from "@testing-library/react";
import {
  ViewProvider,
  useViewContext,
} from "@/components/navigation/ViewContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const push = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  usePathname.mockReturnValue("/my-stream");
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
    function Test() {
      const { handleNavClick } = useViewContext();
      React.useEffect(() => {
        handleNavClick({
          kind: "route",
          name: "Home",
          href: "/home",
          icon: "h",
        });
      }, []);
      return null;
    }
    render(
      <ViewProvider>
        <Test />
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/home");
  });

  it("navigates to waves view when no last visited wave", () => {
    function Test() {
      const { handleNavClick, hardBack } = useViewContext();
      React.useEffect(() => {
        handleNavClick({
          kind: "view",
          name: "Waves",
          viewKey: "waves",
          icon: "w",
        });
        hardBack("waves");
      }, []);
      return null;
    }
    render(
      <ViewProvider>
        <Test />
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/my-stream?view=waves");
    expect(push).toHaveBeenLastCalledWith("/my-stream?view=waves");
  });
});
