import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useState } from "react";
import {
  SidebarWaveNavigationControls,
  SidebarWaveSearchResults,
} from "@/components/brain/left-sidebar/waves/SidebarWaveNavigation";
import type { SidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";
import { mapApiWaveOverviewToSidebarWave } from "@/services/api/waves-v2-api";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { useWaveSidebarSearch } from "@/hooks/useWaveSidebarSearch";

const mockSet = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ activeWave: { set: mockSet } }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: ({ picture }: { picture: string }) => (
    <span data-testid="wave-picture">{picture}</span>
  ),
}));
const wave = mapApiWaveOverviewToSidebarWave({
  id: "rare",
  name: "Rare Pepe acquisition",
  created_at: 123,
  creator: {
    id: "darren",
    handle: "DarrenSRS",
    pfp: null,
    banner1_color: null,
    banner2_color: null,
    cic: 0,
    rep: 0,
    tdh: 0,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    level: 0,
    classification: ApiProfileClassification.Pseudonym,
    sub_classification: null,
    primary_address: "0x0000000000000000000000000000000000000000",
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: null,
    is_wave_creator: true,
  },
  pfp: "https://example.com/pepe.png",
  subscribers_count: 1,
  links_disabled: false,
  has_competition: true,
  is_dm_wave: false,
  has_subwaves: false,
  description_drop: { media: [] },
  total_drops_count: 4,
  is_private: false,
  last_drop_time: 456,
  context_profile_context: {
    pinned: true,
    subscribed: true,
    muted: false,
    can_chat: true,
    unread_drops: 0,
  },
});
function navigation(
  overrides: Partial<SidebarWaveNavigation> = {}
): SidebarWaveNavigation {
  const state = {
    collection: "pinned",
    setCollection: jest.fn(),
    canUseCollections: true,
    queryText: "rare pepe",
    queryEnabled: true,
    searching: true,
    setQueryText: jest.fn(),
    setSearchOpen: jest.fn(),
    resultWaves: [wave],
    results: {
      isPending: false,
      isError: false,
      isFetching: false,
      hasNextPage: false,
      refetch: jest.fn(),
    },
    ...overrides,
  };
  return {
    ...state,
    searchOpen: overrides.searchOpen ?? state.searching,
  } as SidebarWaveNavigation;
}

function InteractiveSearchControls({
  state,
}: {
  state: SidebarWaveNavigation;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <SidebarWaveNavigationControls
      navigation={{
        ...state,
        searchOpen: searchOpen || state.searching,
        setSearchOpen,
      }}
    />
  );
}

function HydrationSearch({ viewerKey }: { viewerKey: string }) {
  const [query, setQueryText] = useWaveSidebarSearch(viewerKey);
  const [searchOpen, setSearchOpen] = useState(false);
  const state = navigation({
    searchOpen: searchOpen || Boolean(query),
    setSearchOpen,
    queryText: query ?? "",
    setQueryText,
    searching: Boolean(query),
    queryEnabled: false,
    canUseCollections: false,
  });
  return (
    <>
      <SidebarWaveNavigationControls navigation={state} />
      {state.searching && <SidebarWaveSearchResults navigation={state} />}
    </>
  );
}

it("shows collection loading below the tabs without changing their labels", () => {
  const state = navigation({
    searching: false,
    collection: "pinned",
    canUseCollections: true,
  });
  const { rerender } = render(
    <SidebarWaveNavigationControls navigation={state} isCollectionLoading />
  );
  const spinner = screen.getByRole("status", { name: "Loading waves…" });
  expect(spinner).toBeVisible();
  expect(screen.getByRole("button", { name: "Pinned" })).toHaveTextContent(
    /^Pinned$/
  );
  expect(
    screen.getByRole("group", { name: "Wave list filter" })
  ).not.toContainElement(spinner);
  rerender(<SidebarWaveNavigationControls navigation={state} />);
  expect(
    screen.queryByRole("status", { name: "Loading waves…" })
  ).not.toBeInTheDocument();
});

it.each(["", "pepe"])(
  "starts empty after hydration despite legacy saved query %j",
  async (savedQuery) => {
    sessionStorage.setItem("hydration-search", savedQuery);
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(
      <HydrationSearch viewerKey={`hydration-${savedQuery}`} />
    );
    const toggle = within(container).getByRole("button", {
      name: "Find a wave…",
    });
    expect(toggle).toBeDisabled();
    expect(within(container).queryByRole("searchbox")).not.toBeInTheDocument();
    const onRecoverableError = jest.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(
          container,
          <HydrationSearch viewerKey={`hydration-${savedQuery}`} />,
          {
            onRecoverableError,
          }
        );
      });
      expect(toggle).toBeEnabled();
      fireEvent.click(toggle);
      const input = within(container).getByRole("searchbox");
      expect(input).toHaveFocus();
      expect(input).toHaveValue("");
      fireEvent.change(input, { target: { value: "xx" } });
      expect(input).toHaveValue("xx");
      expect(within(container).getByRole("status")).toHaveTextContent(
        "Type at least 3 characters to search all waves."
      );
      expect(sessionStorage.getItem("hydration-search")).toBe(savedQuery);
      expect(onRecoverableError).not.toHaveBeenCalled();
    } finally {
      act(() => root?.unmount());
      container.remove();
      sessionStorage.removeItem("hydration-search");
    }
  }
);
it("renders the SEARCH response's creator, picture and pin/follow metadata", () => {
  render(<SidebarWaveSearchResults navigation={navigation()} />);
  expect(screen.getByText("by DarrenSRS")).toBeVisible();
  expect(screen.getByText("Pinned")).toBeVisible();
  expect(screen.getByText("Joined")).toBeVisible();
  expect(screen.getByTestId("wave-picture")).toHaveTextContent(
    "https://example.com/pepe.png"
  );
  fireEvent.click(screen.getByRole("link", { name: /Rare Pepe acquisition/ }));
  expect(mockSet).toHaveBeenCalledWith("rare", { isDirectMessage: false });
});
it("shows input loading only for a searchable query waiting or fetching", () => {
  const state = navigation();
  const { rerender } = render(
    <SidebarWaveNavigationControls navigation={state} />
  );
  const input = screen.getByRole("searchbox");
  expect(input).toHaveAttribute("aria-busy", "false");
  expect(screen.queryByText("Search results · All waves")).toBeNull();
  expect(
    screen.getAllByRole("button", { name: "Close wave search" })
  ).toHaveLength(1);
  rerender(
    <SidebarWaveNavigationControls
      navigation={{ ...state, queryEnabled: false }}
    />
  );
  expect(input).toHaveAttribute("aria-busy", "true");
  rerender(
    <SidebarWaveNavigationControls
      navigation={{ ...state, results: { ...state.results, isFetching: true } }}
    />
  );
  expect(input).toHaveAttribute("aria-busy", "true");
  rerender(<SidebarWaveNavigationControls navigation={state} />);
  expect(input).toHaveAttribute("aria-busy", "false");
  rerender(
    <SidebarWaveNavigationControls
      navigation={{ ...state, queryText: "xx", queryEnabled: false }}
    />
  );
  expect(input).toHaveAttribute("aria-busy", "false");
  fireEvent.click(screen.getByRole("button", { name: "Close wave search" }));
  expect(state.setQueryText).toHaveBeenCalledWith("");
});
it("keeps one live status node through debounce, results, empty and failure", () => {
  const state = navigation();
  const { rerender } = render(
    <SidebarWaveSearchResults navigation={{ ...state, queryEnabled: false }} />
  );
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
  rerender(<SidebarWaveSearchResults navigation={state} />);
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent("Waves shown: 1");
  rerender(
    <SidebarWaveSearchResults navigation={{ ...state, resultWaves: [] }} />
  );
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent(/No waves/);
  rerender(
    <SidebarWaveSearchResults
      navigation={{
        ...state,
        results: {
          ...state.results,
          data: {
            pages: [{ waves: [wave], page: 1, next: false }],
            pageParams: [1],
          },
          error: new Error("Search unavailable"),
          status: "error",
          isError: true,
          isPending: false,
          isLoading: false,
          isLoadingError: false,
          isRefetchError: true,
          isSuccess: false,
          isPlaceholderData: false,
        },
      }}
    />
  );
  expect(screen.getByRole("status")).toBe(status);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(state.results.refetch).toHaveBeenCalled();
});
it("exposes the selected collection through semantics and emphasis, with All first", () => {
  render(
    <SidebarWaveNavigationControls
      navigation={navigation({ queryText: "", searching: false })}
    />
  );
  expect(screen.getByRole("button", { name: "Pinned" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(
    within(screen.getByRole("group", { name: "Wave list filter" }))
      .getAllByRole("button")
      .map((button) => button.textContent)
  ).toEqual(["All", "Pinned", "Joined"]);
  expect(screen.getByRole("button", { name: "Pinned" })).not.toHaveClass(
    "tw-underline"
  );
});

it("switches Joined and All through the replacement collection controls", () => {
  const state = navigation({
    queryText: "",
    searching: false,
    collection: "all",
  });
  const { rerender } = render(
    <SidebarWaveNavigationControls navigation={state} />
  );
  expect(screen.getByRole("group", { name: "Wave list filter" })).toBeVisible();
  expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  fireEvent.click(screen.getByRole("button", { name: "Joined" }));
  expect(state.setCollection).toHaveBeenCalledWith("joined");
  rerender(
    <SidebarWaveNavigationControls
      navigation={{ ...state, collection: "joined" }}
    />
  );
  expect(screen.getByRole("button", { name: "Joined" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  fireEvent.click(screen.getByRole("button", { name: "All" }));
  expect(state.setCollection).toHaveBeenCalledWith("all");
});

it("labels the public list without showing personal collection controls", () => {
  render(
    <SidebarWaveNavigationControls
      navigation={navigation({
        queryText: "",
        searching: false,
        canUseCollections: false,
      })}
    />
  );
  expect(
    screen.queryByRole("group", { name: "Wave list filter" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Joined" })
  ).not.toBeInTheDocument();
  expect(screen.getByText("All Waves")).toBeVisible();
});

it("opens and focuses search, then restores the selected collection on Escape", async () => {
  const state = navigation({ queryText: "", searching: false });
  render(<InteractiveSearchControls state={state} />);
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Find a wave…" }));
  const input = screen.getByRole("searchbox");
  expect(input).toHaveFocus();
  expect(
    screen.queryByRole("group", { name: "Wave list filter" })
  ).not.toBeInTheDocument();
  fireEvent.keyDown(input, { key: "Escape" });
  expect(state.setQueryText).toHaveBeenCalledWith("");
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pinned" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  expect(screen.getByRole("button", { name: "Find a wave…" })).toHaveFocus();
});

it("lets guests open and close an empty search", () => {
  render(
    <InteractiveSearchControls
      state={navigation({
        queryText: "",
        searching: false,
        canUseCollections: false,
      })}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Find a wave…" }));
  expect(screen.getByRole("searchbox")).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Close wave search" }));
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
});
