import { act, renderHook, waitFor } from "@testing-library/react";
import { useDefaultCompetitionNavigation } from "@/hooks/competitions/useDefaultCompetitionNavigation";
import { useDefaultCompetition } from "@/hooks/competitions/useCompetitionQueries";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getImplicitCompetitionRoute,
  getLegacyCompetitionTab,
  shouldResolveDefault,
} from "@/helpers/default-competition.helpers";
import { MyStreamWaveTab } from "@/types/waves.types";
import { getHistoryWaveTab } from "@/hooks/useWaveTabPreference";

let mockPathname = "/waves/wave";
let mockSearch = new URLSearchParams();
const mockReplace = jest.fn();
let mockEnabled = true;
let mockId: string | null = "alpha";
let mockError = false;
let mockSuccess = true;
let mockTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.LEADERBOARD];
let mockLegacyPrimaryId: string | null | undefined = "alpha";
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
  useCompetitionHub: jest.fn(() => ({
    isSuccess: true,
    data: { legacy_primary_competition_id: mockLegacyPrimaryId },
  })),
  useDefaultCompetition: jest.fn(() => ({
    isSuccess: mockSuccess,
    isError: mockError,
    data: { competition_id: mockId, evaluated_at: 100, next_refresh_at: 200 },
  })),
}));
jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({ availableTabs: mockTabs }),
}));
const wave = { id: "wave", chat: { scope: { group: null } } } as ApiWave;
beforeEach(() => {
  mockTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.LEADERBOARD];
  mockLegacyPrimaryId = "alpha";
  localStorage.clear();
  window.history.replaceState(null, "", "/");
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

it("restores remembered Leaderboard only after delayed default identity and tabs are available", () => {
  localStorage.setItem(
    "memes_wave_last_tab_by_id",
    JSON.stringify({ wave: { tab: "LEADERBOARD", competitionId: "alpha" } })
  );
  mockSuccess = false;
  mockTabs = [MyStreamWaveTab.CHAT];
  const { rerender } = renderHook(() =>
    useDefaultCompetitionNavigation(wave, true)
  );
  expect(mockReplace).not.toHaveBeenCalled();
  mockSuccess = true;
  rerender();
  expect(mockReplace).not.toHaveBeenCalled();
  mockTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.LEADERBOARD];
  rerender();
  expect(mockReplace).toHaveBeenCalledWith(
    "/waves/wave/competitions/alpha?tab=leaderboard",
    { scroll: false }
  );
});
it("does not restore a saved competition view into a different default", () => {
  localStorage.setItem(
    "memes_wave_last_tab_by_id",
    JSON.stringify({ wave: { tab: "LEADERBOARD", competitionId: "older" } })
  );
  renderHook(() => useDefaultCompetitionNavigation(wave, true));
  expect(mockReplace).not.toHaveBeenCalled();
});
it("restores the ended legacy leaderboard as Submissions", () => {
  localStorage.setItem(
    "memes_wave_last_tab_by_id",
    JSON.stringify({ wave: { tab: "LEADERBOARD", competitionId: "alpha" } })
  );
  mockTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.SUBMISSIONS];
  renderHook(() => useDefaultCompetitionNavigation(wave, true));
  expect(mockReplace).toHaveBeenCalledWith(
    "/waves/wave/competitions/alpha?tab=leaderboard",
    { scroll: false }
  );
});
it.each([
  "tab=chat",
  "drop=some-drop",
  "entry=some-entry",
  "serialNo=3",
  "curation=gallery",
  "editPost=some-drop",
  "edit=1",
  "create=wave",
  "competition=older",
])("keeps explicit %s ahead of remembered competition navigation", (query) => {
  localStorage.setItem(
    "memes_wave_last_tab_by_id",
    JSON.stringify({ wave: { tab: "LEADERBOARD", competitionId: "alpha" } })
  );
  mockSearch = new URLSearchParams(query);
  renderHook(() => useDefaultCompetitionNavigation(wave, true));
  expect(mockReplace).not.toHaveBeenCalled();
});
it("restores unqualified old preferences only to the immutable legacy primary", () => {
  localStorage.setItem(
    "memes_wave_last_tab_by_id",
    JSON.stringify({ wave: "LEADERBOARD" })
  );
  const { rerender } = renderHook(() =>
    useDefaultCompetitionNavigation(wave, true)
  );
  expect(mockReplace).toHaveBeenCalledWith(
    "/waves/wave/competitions/alpha?tab=leaderboard",
    { scroll: false }
  );
  mockReplace.mockClear();
  mockId = "beta";
  rerender();
  expect(mockReplace).not.toHaveBeenCalled();
});
it("pins an in-progress form even during remembered restoration", () => {
  localStorage.setItem(
    "memes_wave_last_tab_by_id",
    JSON.stringify({ wave: { tab: "LEADERBOARD", competitionId: "alpha" } })
  );
  const form = document.createElement("div");
  form.dataset["competitionCommand"] = "entry";
  document.body.append(form);
  renderHook(() => useDefaultCompetitionNavigation(wave, true));
  expect(mockReplace).not.toHaveBeenCalled();
});

it.each([null, undefined])(
  "waits for a missing legacy primary identity (%s)",
  (id) => {
    window.history.replaceState(null, "", "/waves/wave");
    localStorage.setItem(
      "memes_wave_last_tab_by_id",
      JSON.stringify({ wave: "LEADERBOARD" })
    );
    mockLegacyPrimaryId = id;
    const { rerender } = renderHook(() =>
      useDefaultCompetitionNavigation(wave, true)
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(getHistoryWaveTab("wave")).toBeUndefined();
    mockLegacyPrimaryId = "alpha";
    rerender();
    expect(mockReplace).toHaveBeenCalledWith(
      "/waves/wave/competitions/alpha?tab=leaderboard",
      { scroll: false }
    );
  }
);

it("preserves a form opened while remembered default data is pending", () => {
  localStorage.setItem(
    "memes_wave_last_tab_by_id",
    JSON.stringify({ wave: { tab: "LEADERBOARD", competitionId: "alpha" } })
  );
  mockSuccess = false;
  const { rerender } = renderHook(() =>
    useDefaultCompetitionNavigation(wave, true)
  );
  const dialog = document.createElement("section");
  dialog.setAttribute("role", "dialog");
  document.body.append(dialog);
  mockSuccess = true;
  rerender();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("cancels remembered navigation when a command opens before the destination commits", async () => {
  window.history.replaceState(null, "", "/waves/wave");
  localStorage.setItem(
    "memes_wave_last_tab_by_id",
    JSON.stringify({ wave: { tab: "LEADERBOARD", competitionId: "alpha" } })
  );
  const { rerender } = renderHook(() =>
    useDefaultCompetitionNavigation(wave, true)
  );
  expect(mockReplace).toHaveBeenCalledWith(
    "/waves/wave/competitions/alpha?tab=leaderboard",
    { scroll: false }
  );
  const command = document.createElement("section");
  command.setAttribute("data-competition-command", "entry");
  document.body.append(command);
  await waitFor(() =>
    expect(mockReplace).toHaveBeenLastCalledWith("/waves/wave", {
      scroll: false,
    })
  );
  expect(getHistoryWaveTab("wave")).toBe(MyStreamWaveTab.CHAT);
  mockReplace.mockClear();
  rerender();
  expect(mockReplace).not.toHaveBeenCalled();
});

it.each(["data-competition-command", "role"])(
  "keeps the committed destination when its %s control mounts before effect cleanup",
  async (attribute) => {
    window.history.replaceState(null, "", "/waves/wave");
    localStorage.setItem(
      "memes_wave_last_tab_by_id",
      JSON.stringify({ wave: { tab: "LEADERBOARD", competitionId: "alpha" } })
    );
    renderHook(() => useDefaultCompetitionNavigation(wave, true));
    const target = "/waves/wave/competitions/alpha?tab=leaderboard";
    expect(mockReplace).toHaveBeenCalledWith(target, { scroll: false });
    // Commit the URL without a rerender, retaining the previous render's observer.
    window.history.replaceState(null, "", target);
    const command = document.createElement("section");
    command.setAttribute(attribute, attribute === "role" ? "dialog" : "entry");
    await act(async () => {
      document.body.append(command);
      await Promise.resolve();
    });
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/waves/wave/competitions/alpha");
    expect(getHistoryWaveTab("wave")).toBeUndefined();
  }
);
