import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import BackButton from "@/components/navigation/BackButton";
let mockIsApp = false;
let mockIsIos = false;
jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      getPlatform: () => (mockIsIos ? "ios" : "android"),
    },
  };
});
const mockChevronBack = jest.fn((_: string, navigate: () => void) =>
  navigate()
);
jest.mock("@/helpers/waves/wave-navigation-transition", () => ({
  ...jest.requireActual("@/helpers/waves/wave-navigation-transition"),
  runPhoneChevronBackTransition: (pathname: string, navigate: () => void) =>
    mockChevronBack(pathname, navigate),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: jest.fn(),
}));
jest.mock("@/hooks/useWave", () => ({
  useWave: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: jest.fn(),
}));
jest.mock("@/components/utils/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isApp: mockIsApp,
    isMobileDevice: false,
    hasTouchScreen: false,
  }),
}));

const mockClearLastVisited = jest.fn();
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: () => ({
    clearLastVisited: mockClearLastVisited,
  }),
}));

const mockGoBack = jest.fn();
const mockGoBackTo = jest.fn();
jest.mock("@/contexts/NavigationHistoryContext", () => ({
  useNavigationHistoryContext: () => ({
    goBack: mockGoBack,
    goBackTo: mockGoBackTo,
  }),
}));

const { useRouter, useSearchParams, usePathname } = require("next/navigation");
const { useWaveData } = require("@/hooks/useWaveData");
const { useWave } = require("@/hooks/useWave");
const { useMyStreamOptional } = require("@/contexts/wave/MyStreamContext");

function setup(
  query: Record<string, string> = {},
  opts: {
    wave?: object | undefined;
    isDm?: boolean | undefined;
    activeWaveId?: string | null | undefined;
    returnTo?: string | null | undefined;
    pathname?: string | undefined;
  } = {}
) {
  const replace = jest.fn();
  const back = jest.fn();
  const prefetch = jest.fn();
  const setActiveWave = jest.fn();
  const searchParams = new URLSearchParams();
  Object.keys(query).forEach((key) => searchParams.set(key, query[key]));

  (useRouter as jest.Mock).mockReturnValue({ replace, back, prefetch });
  (useSearchParams as jest.Mock).mockReturnValue(searchParams);
  const pathname = opts.pathname ?? "/test";
  (usePathname as jest.Mock).mockReturnValue(pathname);
  window.history.replaceState(null, "", `${pathname}?${searchParams}`);
  (useWaveData as jest.Mock).mockReturnValue({ data: opts.wave });
  (useWave as jest.Mock).mockReturnValue({ isDm: opts.isDm ?? false });
  (useMyStreamOptional as jest.Mock).mockReturnValue({
    activeWave: {
      id: opts.activeWaveId ?? null,
      set: setActiveWave,
    },
  });

  const utils = render(<BackButton returnTo={opts.returnTo} />);
  return { ...utils, replace, back, prefetch, setActiveWave };
}

describe("BackButton", () => {
  afterEach(() => {
    mockIsApp = false;
    mockIsIos = false;
    jest.clearAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("uses the whole-channel transition for iPhone chevron Back", () => {
    mockIsApp = true;
    mockIsIos = true;
    const { setActiveWave } = setup(
      {},
      { activeWaveId: "w1", pathname: "/waves/w1" }
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockChevronBack).toHaveBeenCalledWith(
      "/waves",
      expect.any(Function)
    );
    expect(setActiveWave).toHaveBeenCalledWith(null, {
      isDirectMessage: false,
    });
  });

  it.each([true, false])(
    "slides back to Messages on iPhone even if DM details are pending (loaded: %s)",
    (isDm) => {
      mockIsApp = true;
      mockIsIos = true;
      const { setActiveWave } = setup({}, { pathname: "/messages/dm1", isDm });
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      expect(mockChevronBack).toHaveBeenCalledWith(
        "/messages",
        expect.any(Function)
      );
      expect(mockClearLastVisited).toHaveBeenCalledWith("dm");
      expect(setActiveWave).toHaveBeenCalledWith(null, {
        isDirectMessage: true,
      });
    }
  );

  it.each(["other-native", "phone-web", "other-native-dm", "profile-feed"])(
    "shares the requested phone Back motion for %s",
    (surface) => {
      mockIsApp = surface !== "phone-web";
      mockIsIos = !surface.startsWith("other-native");
      const query =
        surface === "profile-feed"
          ? { returnTo: "/waves?view=profile-feed" }
          : {};
      let pathname = "/waves/w1";
      if (surface === "other-native-dm") pathname = "/messages/w1";
      const { setActiveWave } = setup(query, {
        activeWaveId: "w1",
        pathname,
        isDm: surface === "other-native-dm",
      });
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      expect(mockChevronBack).toHaveBeenCalledWith(
        surface === "other-native-dm" ? "/messages" : "/waves",
        expect.any(Function)
      );
      expect(setActiveWave).toHaveBeenCalledWith(
        null,
        surface === "profile-feed"
          ? { profileFeed: true }
          : { isDirectMessage: surface === "other-native-dm" }
      );
    }
  );

  it("preserves direct Back for an active wave in another section", () => {
    mockIsApp = true;
    mockIsIos = true;
    const { setActiveWave } = setup(
      {},
      { activeWaveId: "w1", pathname: "/network" }
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockChevronBack).not.toHaveBeenCalled();
    expect(setActiveWave).toHaveBeenCalledWith(null, {
      isDirectMessage: false,
    });
  });

  it("clears the remembered wave only when the Back motion commits", () => {
    mockIsApp = true;
    let complete: () => void = () => undefined;
    mockChevronBack.mockImplementationOnce((_, navigate) => {
      complete = navigate;
    });
    const { setActiveWave } = setup(
      {},
      { activeWaveId: "w1", pathname: "/waves/w1" }
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockClearLastVisited).not.toHaveBeenCalled();
    expect(setActiveWave).not.toHaveBeenCalled();
    act(() => complete());
    expect(mockClearLastVisited).toHaveBeenCalledTimes(1);
    expect(setActiveWave).toHaveBeenCalledTimes(1);
  });

  it.each([
    "/waves/w1/decisions",
    "/waves/w1/decisions/alpha",
    "/waves/w1/decisions/new",
  ])("keeps a missing competition recoverable on %s", (pathname) => {
    const { replace, setActiveWave } = setup({}, { pathname });
    const options = useWaveData.mock.calls.at(-1)[0];
    expect(options.onWaveNotFound).toBeUndefined();
    expect(replace).not.toHaveBeenCalled();
    expect(setActiveWave).not.toHaveBeenCalled();
  });

  it.each([
    ["/waves/w1", "/waves"],
    ["/waves", "/waves"],
    ["/messages/w1", "/messages"],
    ["/messages", "/messages"],
  ])(
    "clears a current ordinary missing wave on %s",
    (pathname, destination) => {
      const { replace, setActiveWave } = setup(
        { wave: "w1", serialNo: "23" },
        { pathname }
      );
      const callback = useWaveData.mock.calls.at(-1)[0].onWaveNotFound;
      // The pending request must preserve parameters changed since it began.
      window.history.replaceState(null, "", `${pathname}?wave=w1&serialNo=24`);
      act(() => callback());
      expect(setActiveWave).toHaveBeenCalledWith(null);
      expect(replace).toHaveBeenCalledWith(`${destination}?serialNo=24`, {
        scroll: false,
      });
    }
  );

  it.each([
    "/waves/w1/decisions/alpha?tab=leaderboard",
    "/waves/w2?tab=chat",
    "/network?wave=w1",
  ])(
    "ignores a captured missing-wave callback after moving to %s",
    (target) => {
      const { replace, setActiveWave } = setup({}, { pathname: "/waves/w1" });
      const callback = useWaveData.mock.calls.at(-1)[0].onWaveNotFound;
      window.history.replaceState(null, "", target);
      act(() => callback());
      expect(replace).not.toHaveBeenCalled();
      expect(setActiveWave).not.toHaveBeenCalled();
    }
  );

  it("still lets the user explicitly leave a competition", async () => {
    const { setActiveWave } = setup(
      {},
      { pathname: "/waves/w1/decisions/alpha", activeWaveId: "w1" }
    );
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockClearLastVisited).toHaveBeenCalledWith("wave");
    expect(setActiveWave).toHaveBeenCalledWith(null, {
      isDirectMessage: false,
    });
  });

  it("removes drop param and replaces route", async () => {
    const { replace } = setup({ drop: "123" });
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(replace).toHaveBeenCalledWith("/test", { scroll: false });
  });

  it("navigates back to messages when wave is DM", async () => {
    const { replace, setActiveWave } = setup(
      { wave: "w1" },
      { wave: {}, isDm: true, activeWaveId: "w1" }
    );
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockClearLastVisited).toHaveBeenCalledWith("dm");
    expect(setActiveWave).toHaveBeenCalledWith(null, { isDirectMessage: true });
    expect(replace).not.toHaveBeenCalled();
  });

  it("navigates back to waves when wave is not DM", async () => {
    const { replace, setActiveWave } = setup(
      { wave: "w1" },
      { wave: {}, isDm: false, activeWaveId: "w1" }
    );
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockClearLastVisited).toHaveBeenCalledWith("wave");
    expect(setActiveWave).toHaveBeenCalledWith(null, {
      isDirectMessage: false,
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("calls goBack when no wave and no drop", async () => {
    setup({});
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("stays busy only while navigation is pending and recovers afterward", async () => {
    let finish = () => {};
    mockGoBack.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    setup({});
    const back = screen.getByRole("button", { name: "Back" });
    fireEvent.click(back);
    expect(back).toHaveAttribute("aria-busy", "true");
    expect(back).toBeDisabled();
    await act(async () => finish());
    expect(back).toHaveAttribute("aria-busy", "false");
    expect(back).toBeEnabled();
  });

  it("returns from the native feed to Waves without a route navigation", async () => {
    mockIsApp = true;
    const { setActiveWave, prefetch } = setup(
      { view: "profile-feed" },
      { pathname: "/waves", returnTo: "/waves" }
    );
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(setActiveWave).toHaveBeenCalledWith(null);
    expect(mockGoBackTo).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("uses the explicit collected return target when provided", async () => {
    const returnTo =
      "/Shelby/collected?collection=memelab#collected-card-memelab-65";
    const { prefetch } = setup({}, { returnTo });

    expect(prefetch).toHaveBeenCalledWith(returnTo);

    await userEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mockGoBackTo).toHaveBeenCalledWith(returnTo);
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
  });
});
