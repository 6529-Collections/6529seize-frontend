import { act, renderHook } from "@testing-library/react";
import { useWaveTabNavigation } from "@/hooks/useWaveTabNavigation";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

describe("useWaveTabNavigation", () => {
  const initialUrl = globalThis.location.href;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.history.replaceState(
      null,
      "",
      "/waves/wave/competitions/rank?tab=leaderboard"
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.history.replaceState(null, "", initialUrl);
  });

  it("pushes a tab-only change without requesting the page again", () => {
    const pushState = jest.spyOn(globalThis.history, "pushState");
    const { result } = renderHook(useWaveTabNavigation);

    act(() => result.current("/waves/wave/competitions/rank?tab=decisions"));

    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      "/waves/wave/competitions/rank?tab=decisions"
    );
    expect(globalThis.location.search).toBe("?tab=decisions");
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("preserves replace semantics for wave tabs", () => {
    globalThis.history.replaceState(
      null,
      "",
      "/waves/wave?competition=rank&tab=chat"
    );
    const replaceState = jest.spyOn(globalThis.history, "replaceState");
    const { result } = renderHook(useWaveTabNavigation);

    act(() =>
      result.current("/waves/wave?tab=about&competition=rank", "replace")
    );

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/waves/wave?tab=about&competition=rank"
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not add history entries when the requested URL is already active", () => {
    const pushState = jest.spyOn(globalThis.history, "pushState");
    const { result } = renderHook(useWaveTabNavigation);

    act(() => result.current(globalThis.location.href));

    expect(pushState).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it.each([
    "/waves/another/competitions/rank?tab=decisions",
    "/waves/wave/competitions/another?tab=decisions",
    "/waves/wave?tab=chat",
    "/waves/wave/competitions/rank?tab=decisions&serialNo=10",
    "/waves/wave/competitions/rank?tab=decisions&drop=drop",
    "/waves/wave/competitions/rank?tab=decisions&entry=entry",
    "/waves/wave/competitions/rank?tab=decisions&curation=curation",
    "/waves/wave/competitions/rank?tab=decisions&default=true",
    "/waves/wave/competitions/rank?tab=decisions&create=wave",
    "/waves/wave/competitions/rank?tab=decisions#target",
    "https://example.org/waves/wave/competitions/rank?tab=decisions",
  ])("keeps real navigation for a non-tab change: %s", (href) => {
    const pushState = jest.spyOn(globalThis.history, "pushState");
    const { result } = renderHook(useWaveTabNavigation);

    act(() => result.current(href));

    expect(mockPush).toHaveBeenCalledWith(href, { scroll: false });
    expect(pushState).not.toHaveBeenCalled();
  });

  it("keeps router replacement when another parameter changes", () => {
    const { result } = renderHook(useWaveTabNavigation);

    act(() => result.current("/waves/wave?tab=about", "replace"));

    expect(mockReplace).toHaveBeenCalledWith("/waves/wave?tab=about", {
      scroll: false,
    });
  });
});
