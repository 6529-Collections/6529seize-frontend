import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  NavigationHistoryProvider,
  useNavigationHistoryContext,
} from "@/contexts/NavigationHistoryContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useViewContext } from "@/components/navigation/ViewContext";
import { BrainView } from "@/components/brain/mobile/brainMobileViews";

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
  replace: jest.fn(),
  back: jest.fn(),
  events: { on: jest.fn(), off: jest.fn() },
};
const hardBack = jest.fn();
let mockPathname = "/";
let mockSearchParams = new URLSearchParams();
(useRouter as jest.Mock).mockReturnValue(routerMock);
(usePathname as jest.Mock).mockImplementation(() => mockPathname);
(useSearchParams as jest.Mock).mockImplementation(() => mockSearchParams);
(useViewContext as jest.Mock).mockReturnValue({ hardBack });

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
);
const strictWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <React.StrictMode>
    <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
  </React.StrictMode>
);

describe("NavigationHistoryContext", () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    hardBack.mockClear();
    mockPathname = "/";
    mockSearchParams = new URLSearchParams();
  });

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

  it("stores canonical message paths for query-style message routes", () => {
    mockPathname = "/messages";
    mockSearchParams = new URLSearchParams("wave=dm-wave");
    const { result, rerender } = renderHook(
      () => useNavigationHistoryContext(),
      {
        wrapper,
      }
    );

    mockPathname = "/waves/wave-1";
    mockSearchParams = new URLSearchParams();
    rerender();

    act(() => {
      result.current.goBack();
    });

    expect(routerMock.push).toHaveBeenCalledWith("/messages/dm-wave");
  });

  it("pops navigation state while returning to an explicit route", () => {
    mockPathname = "/Shelby/collected";
    mockSearchParams = new URLSearchParams("collection=memelab");
    const { result, rerender } = renderHook(
      () => useNavigationHistoryContext(),
      { wrapper }
    );

    mockPathname = "/meme-lab/65";
    mockSearchParams = new URLSearchParams();
    rerender();

    mockPathname = "/meme-lab/66";
    rerender();

    const returnTo =
      "/Shelby/collected?collection=memelab#collected-card-memelab-65";
    act(() => {
      result.current.goBackTo(returnTo);
    });

    expect(routerMock.push).toHaveBeenCalledWith(returnTo);

    mockPathname = "/Shelby/collected";
    mockSearchParams = new URLSearchParams("collection=memelab");
    rerender();
    expect(result.current.canGoBack).toBe(false);
  });

  it("navigates to an explicit stacked route once in Strict Mode", () => {
    mockPathname = "/Shelby/collected";
    const { result, rerender } = renderHook(
      () => useNavigationHistoryContext(),
      { wrapper: strictWrapper }
    );

    mockPathname = "/meme-lab/65";
    rerender();

    act(() => {
      result.current.goBackTo("/Shelby/collected");
    });

    expect(routerMock.push).toHaveBeenCalledTimes(1);
    expect(routerMock.push).toHaveBeenCalledWith("/Shelby/collected");
  });

  it("replaces the current history entry when the explicit route is not stacked", () => {
    mockPathname = "/network";
    const { result, rerender } = renderHook(
      () => useNavigationHistoryContext(),
      { wrapper }
    );

    mockPathname = "/meme-lab/65";
    rerender();

    const returnTo =
      "/Shelby/collected?collection=memelab#collected-card-memelab-65";
    act(() => {
      result.current.goBackTo(returnTo);
    });

    expect(routerMock.replace).toHaveBeenCalledWith(returnTo);

    mockPathname = "/Shelby/collected";
    mockSearchParams = new URLSearchParams("collection=memelab");
    rerender();
    expect(result.current.canGoBack).toBe(true);

    act(() => {
      result.current.goBack();
    });
    expect(routerMock.push).toHaveBeenCalledWith("/network");
  });

  it.each(["goBack", "goBackTo"] as const)(
    "restores the wave view on repeated profile round trips using %s",
    (navigation) => {
      mockPathname = "/waves/wave-1";
      const { result, rerender } = renderHook(
        () => useNavigationHistoryContext(),
        { wrapper }
      );
      const selection = { waveId: "wave-1", view: BrainView.LEADERBOARD };

      act(() => {
        result.current.rememberWaveView(selection);
      });

      for (let visit = 0; visit < 2; visit += 1) {
        mockPathname = "/Articulate";
        rerender();
        expect(result.current.currentWaveView).toBeNull();

        act(() => {
          if (navigation === "goBackTo") {
            result.current.goBackTo("/waves/wave-1");
          } else {
            result.current.goBack();
          }
        });

        expect(routerMock.push).toHaveBeenLastCalledWith("/waves/wave-1");
        mockPathname = "/waves/wave-1";
        rerender();
        expect(result.current.currentWaveView).toEqual(selection);
      }
    }
  );

  it("does not restore a previous visit when navigating normally between waves", () => {
    mockPathname = "/waves/wave-1";
    const { result, rerender } = renderHook(
      () => useNavigationHistoryContext(),
      { wrapper }
    );

    act(() => {
      result.current.rememberWaveView({
        waveId: "wave-1",
        view: BrainView.ABOUT,
      });
    });
    mockPathname = "/waves/wave-2";
    rerender();
    mockPathname = "/waves/wave-1";
    rerender();

    expect(result.current.currentWaveView).toBeNull();
  });

  it("does not record a wave selection against another route", () => {
    mockPathname = "/Articulate";
    const { result, rerender } = renderHook(
      () => useNavigationHistoryContext(),
      { wrapper }
    );

    act(() => {
      result.current.rememberWaveView({
        waveId: "wave-1",
        view: BrainView.LEADERBOARD,
      });
    });
    mockPathname = "/waves/wave-1";
    rerender();
    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentWaveView).toBeNull();
  });
});
