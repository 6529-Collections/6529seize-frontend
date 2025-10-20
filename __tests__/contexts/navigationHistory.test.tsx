import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  NavigationHistoryProvider,
  useNavigationHistoryContext,
} from "@/contexts/NavigationHistoryContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useViewContext } from "@/components/navigation/ViewContext";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: jest.fn(),
}));

const routerMock = {
  push: jest.fn(),
  back: jest.fn(),
  events: { on: jest.fn(), off: jest.fn() },
};
const hardBack = jest.fn();
(useRouter as jest.Mock).mockReturnValue(routerMock);
(usePathname as jest.Mock).mockReturnValue("/");
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
(useViewContext as jest.Mock).mockReturnValue({ hardBack, homeActiveTab: "latest" });

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
);

describe("NavigationHistoryContext", () => {
  it("pushes view and navigates back to previous route", () => {
    const { result } = renderHook(() => useNavigationHistoryContext(), {
      wrapper,
    });
    act(() => {
      result.current.pushView("test" as any);
    });
    act(() => {
      result.current.goBack();
    });
    expect(routerMock.push).toHaveBeenCalledWith("/");
  });

  it("navigates back through stacked views", () => {
    const { result } = renderHook(() => useNavigationHistoryContext(), {
      wrapper,
    });
    act(() => {
      result.current.pushView("v1" as any);
      result.current.pushView("v2" as any);
    });
    act(() => {
      result.current.goBack();
    });
    expect(hardBack).toHaveBeenCalledWith("v1");
  });
});
