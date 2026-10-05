import { renderHook, waitFor } from "@testing-library/react";
import { useDefaultCompetitionNavigation } from "@/hooks/competitions/useDefaultCompetitionNavigation";
import { useDefaultCompetition } from "@/hooks/competitions/useCompetitionQueries";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getImplicitCompetitionRoute,
  getLegacyCompetitionTab,
  shouldResolveDefault,
} from "@/helpers/default-competition.helpers";
import { MyStreamWaveTab } from "@/types/waves.types";

let mockPathname = "/waves/wave";
let mockSearch = new URLSearchParams();
const mockReplace = jest.fn();
let mockEnabled = true;
let mockId: string | null = "alpha";
let mockError = false;
let mockSuccess = true;
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearch,
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/helpers/competition.helpers", () => ({
  ...jest.requireActual("@/helpers/competition.helpers"),
  isMultiCompetitionEnabled: () => mockEnabled,
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useDefaultCompetition: jest.fn(() => ({
    isSuccess: mockSuccess,
    isError: mockError,
    data: { competition_id: mockId, evaluated_at: 100, next_refresh_at: 200 },
  })),
}));
const wave = { id: "wave", chat: { scope: { group: null } } } as ApiWave;
beforeEach(() => {
  mockPathname = "/waves/wave";
  mockSearch = new URLSearchParams();
  mockEnabled = true;
  mockId = "alpha";
  mockError = false;
  mockSuccess = true;
  jest.clearAllMocks();
});

afterEach(() =>
  document
    .querySelectorAll("[data-competition-command], [role=dialog]")
    .forEach((element) => element.remove())
);

it.each(["/waves/wave", "/my-stream"])(
  "keeps bare entry in Chat after delayed default resolution (%s)",
  (pathname) => {
    mockPathname = pathname;
    mockSearch = new URLSearchParams(
      pathname === "/my-stream" ? "wave=wave" : ""
    );
    mockSuccess = false;
    const { rerender } = renderHook(() =>
      useDefaultCompetitionNavigation(wave, true)
    );
    expect(mockReplace).not.toHaveBeenCalled();
    mockSuccess = true;
    rerender();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(useDefaultCompetition).toHaveBeenLastCalledWith("wave", false);
  }
);

it.each([
  ["leaderboard", "leaderboard"],
  ["voters", "voters"],
  ["winners", "decisions"],
  ["my_votes", "votes"],
  ["configuration", "rules"],
  ["outcome", "outcomes"],
])(
  "resolves the default for an explicit %s destination",
  (tab, destination) => {
    mockSearch = new URLSearchParams({ tab });
    renderHook(() => useDefaultCompetitionNavigation(wave, true));
    expect(mockReplace).toHaveBeenCalledWith(
      `/waves/wave/competitions/alpha?tab=${destination}&default=1`,
      { scroll: false }
    );
  }
);

it.each([
  "entry=older",
  "drop=old-drop",
  "serialNo=23",
  "curation=gallery",
  "tab=chat",
  "default=1",
  "default=1&tab=chat",
  "tab=faq",
  "competition=older&tab=chat",
])("preserves explicit wave targets (%s)", (search) => {
  mockSearch = new URLSearchParams(search);
  renderHook(() => useDefaultCompetitionNavigation(wave, true));
  expect(useDefaultCompetition).toHaveBeenLastCalledWith("wave", false);
  expect(mockReplace).not.toHaveBeenCalled();
});

it("preserves explicit competition links across refresh and updates only the implicit context", () => {
  mockPathname = "/waves/wave/competitions/older";
  mockSearch = new URLSearchParams("tab=outcomes");
  const { rerender } = renderHook(() =>
    useDefaultCompetitionNavigation(wave, true)
  );
  expect(mockReplace).not.toHaveBeenCalled();
  mockSearch = new URLSearchParams("default=1&tab=outcomes");
  rerender();
  expect(mockReplace).toHaveBeenLastCalledWith(
    "/waves/wave/competitions/alpha?default=1&tab=outcomes",
    { scroll: false }
  );
  mockId = "beta";
  rerender();
  expect(mockReplace).toHaveBeenLastCalledWith(
    "/waves/wave/competitions/beta?default=1&tab=outcomes",
    { scroll: false }
  );
});

it("keeps zero competitions implicitly refreshable and returns an emptied detail to chat", () => {
  mockId = null;
  const { rerender } = renderHook(() =>
    useDefaultCompetitionNavigation(wave, true)
  );
  expect(mockReplace).not.toHaveBeenCalled();
  mockPathname = "/waves/wave/competitions/alpha";
  mockSearch = new URLSearchParams("default=1");
  rerender();
  expect(mockReplace).toHaveBeenCalledWith("/waves/wave?default=1&tab=chat", {
    scroll: false,
  });
  expect(
    shouldResolveDefault(
      "/waves/wave",
      new URLSearchParams("default=1&tab=chat")
    )
  ).toBe(false);
});

it.each(["data-competition-command", "role"])(
  "pins an open command before an implicit context change (%s)",
  async (attribute) => {
    mockPathname = "/waves/wave/competitions/alpha";
    mockSearch = new URLSearchParams("default=1&tab=leaderboard");
    const { rerender } = renderHook(() =>
      useDefaultCompetitionNavigation(wave, true)
    );
    const command = document.createElement("section");
    command.setAttribute(attribute, attribute === "role" ? "dialog" : "");
    document.body.append(command);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/waves/wave/competitions/alpha?tab=leaderboard",
        { scroll: false }
      )
    );
    mockReplace.mockClear();
    mockSearch = new URLSearchParams("tab=leaderboard");
    mockId = "beta";
    rerender();
    expect(mockReplace).not.toHaveBeenCalled();
  }
);

it("does not navigate on selection errors, disabled rollout or direct messages", () => {
  mockError = true;
  const { rerender } = renderHook(() =>
    useDefaultCompetitionNavigation(wave, true)
  );
  expect(mockReplace).not.toHaveBeenCalled();
  mockReplace.mockClear();
  mockError = false;
  mockEnabled = false;
  rerender();
  expect(mockReplace).not.toHaveBeenCalled();
  mockReplace.mockClear();
  mockEnabled = true;
  renderHook(() =>
    useDefaultCompetitionNavigation(
      {
        ...wave,
        chat: { scope: { group: { is_direct_message: true } } },
      } as ApiWave,
      true
    )
  );
  expect(mockReplace).not.toHaveBeenCalled();
});

it("maps the familiar legacy tabs and retains view parameters on implicit navigation", () => {
  expect(getLegacyCompetitionTab("leaderboard")).toBe(
    MyStreamWaveTab.LEADERBOARD
  );
  expect(getLegacyCompetitionTab("decisions")).toBe(MyStreamWaveTab.WINNERS);
  expect(getLegacyCompetitionTab("outcomes")).toBe(MyStreamWaveTab.OUTCOME);
  expect(getLegacyCompetitionTab("votes")).toBe(MyStreamWaveTab.MY_VOTES);
  expect(
    getImplicitCompetitionRoute(
      "wave",
      "alpha",
      new URLSearchParams("tab=votes")
    )
  ).toBe("/waves/wave/competitions/alpha?tab=votes&default=1");
});

it.each([
  "/waves/wave/competitions",
  "/waves/wave/competitions/new",
  "/waves/wave/competitions/draft",
])(
  "never resolves collection/editor routes even with an implicit marker (%s)",
  (pathname) => {
    expect(
      shouldResolveDefault(pathname, new URLSearchParams("default=1"))
    ).toBe(false);
  }
);

it.each([
  ["tab=configuration", "/waves/wave/competitions/alpha?tab=rules&default=1"],
  [
    "tab=configuration&competition=older",
    "/waves/wave/competitions/older?tab=rules",
  ],
])(
  "canonicalizes the selected competition configuration alias (%s)",
  (query, target) => {
    mockSearch = new URLSearchParams(query);
    const { result } = renderHook(() =>
      useDefaultCompetitionNavigation(wave, true)
    );
    expect(mockReplace).toHaveBeenCalledWith(target, { scroll: false });
    expect(result.current.resolve).toBe(true);
  }
);
