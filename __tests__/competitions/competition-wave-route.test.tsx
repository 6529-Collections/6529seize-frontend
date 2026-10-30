import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import WaveRouteShell from "@/components/waves/WaveRouteShell";
import {
  CompetitionRouteProvider,
  useCompetitionRoute,
} from "@/contexts/CompetitionRouteContext";
import { useCompetitionNavigation } from "@/contexts/CompetitionNavigationContext";
import {
  useCompetitionDetail,
  useCompetitionHub,
  useDefaultCompetition,
} from "@/hooks/competitions/useCompetitionQueries";
import { useWaveData } from "@/hooks/useWaveData";

type QueryState<T> = {
  data: T | undefined;
  error: unknown;
  isError: boolean;
  refetch: jest.Mock;
};

type CompetitionFixture = {
  id: string;
  wave_id: string;
  lifecycle: string;
};

let mockViewer: string | null = "member";
let mockSearch = "";
let mockPathname = "/waves/wave/competitions/alpha";
let mockWaveQuery: QueryState<{ id: string }>;
let mockHubQuery: QueryState<{
  id: string;
  legacy_primary_competition_id: string | null;
}>;
let mockCompetitionQuery: QueryState<CompetitionFixture>;
let mockSelectionQuery: QueryState<{ competition_id: string | null }> & {
  isFetching: boolean;
  isFetchedAfterMount: boolean;
};

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    jest.requireActual("@/components/competitions/CompetitionWaveContent")
      .default,
}));
jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({ activeContentTab: "LEADERBOARD" }),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ registerWave: mockRegisterWave }),
}));
const mockRegisterWave = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: jest.fn(() => mockWaveQuery),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => mockViewer,
  useCompetitionHub: jest.fn(() => mockHubQuery),
  useCompetitionDetail: jest.fn(() => mockCompetitionQuery),
  useDefaultCompetition: jest.fn(() => mockSelectionQuery),
}));
jest.mock("@/components/brain/my-stream/MyStreamWave", () => {
  const { useCompetitionNavigation: useNavigation } = jest.requireActual(
    "@/contexts/CompetitionNavigationContext"
  );
  return function MockStreamWave({
    competitionContent,
  }: {
    competitionContent?: ReactNode;
  }) {
    const { flat } = useNavigation();
    return (
      <div data-testid="wave" data-flat={String(flat)}>
        {competitionContent ?? "Direct legacy content"}
      </div>
    );
  };
});
jest.mock("@/components/competitions/CompetitionDetail", () => ({
  __esModule: true,
  default: () => <section data-testid="detail">Nested detail</section>,
  NativeCompetitionContent: ({ embedded }: { embedded: boolean }) => (
    <div data-testid="native" data-embedded={String(embedded)}>
      <input aria-label="Entry text" />
    </div>
  ),
}));
jest.mock("@/components/competitions/CompetitionState", () => ({
  CompetitionState: ({
    error,
    retry,
  }: {
    error: boolean;
    retry: () => void;
  }) => (
    <div role="status">
      {error ? "Competition unavailable" : "Loading competition"}
      <button onClick={retry}>Retry</button>
    </div>
  ),
}));

function RouteProbe() {
  const route = useCompetitionRoute();
  const { flat, nativeCompetition } = useCompetitionNavigation();
  return (
    <div
      data-testid="persistent-shell"
      data-flat={String(flat)}
      data-ready={String(route.value !== null)}
      data-native={nativeCompetition?.id ?? ""}
    />
  );
}

function routeTree(competitionId: string | null = "alpha", waveId = "wave") {
  return (
    <CompetitionRouteProvider>
      <RouteProbe />
      {competitionId !== null && <WaveRouteShell waveId={waveId} />}
    </CompetitionRouteProvider>
  );
}

function query<T>(data: T): QueryState<T> {
  return { data, error: null, isError: false, refetch: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockViewer = "member";
  mockSearch = "";
  mockPathname = "/waves/wave/competitions/alpha";
  mockWaveQuery = query({ id: "wave" });
  mockHubQuery = query({ id: "wave", legacy_primary_competition_id: null });
  mockCompetitionQuery = query({
    id: "alpha",
    wave_id: "wave",
    lifecycle: "PUBLISHED",
  });
  mockSelectionQuery = {
    ...query({ competition_id: "alpha" }),
    isFetching: false,
    isFetchedAfterMount: true,
  };
});

it("renders a native selection directly in the wave without another shell", () => {
  render(routeTree());
  expect(screen.getByTestId("wave")).toHaveAttribute("data-flat", "true");
  expect(screen.getByTestId("native")).toHaveAttribute("data-embedded", "true");
  expect(screen.queryByTestId("detail")).toBeNull();
  expect(screen.getAllByTestId("persistent-shell")).toHaveLength(1);
});

it("uses competition resources when the selected competition is the original primary", () => {
  mockHubQuery.data!.legacy_primary_competition_id = "alpha";
  render(routeTree());
  expect(screen.getAllByTestId("wave")).toHaveLength(1);
  expect(screen.queryByText("Direct legacy content")).toBeNull();
  expect(screen.getByTestId("native")).toBeVisible();
  expect(screen.queryByTestId("detail")).toBeNull();
});

it.each(["rules", "votes", "voters"])(
  "renders shared configuration/votes content for legacy %s",
  (tab) => {
    mockHubQuery.data!.legacy_primary_competition_id = "alpha";
    mockSearch = `tab=${tab}`;
    render(routeTree());
    expect(screen.getByTestId("native")).toBeVisible();
    expect(screen.getAllByTestId("wave")).toHaveLength(1);
  }
);

it.each(["loading", "error"])(
  "retains the intended flat section during a first selected-route %s",
  (state) => {
    mockCompetitionQuery.data = undefined;
    mockCompetitionQuery.isError = state === "error";
    mockCompetitionQuery.error = state === "error" ? { status: 503 } : null;
    render(routeTree());
    expect(screen.getByTestId("wave")).toHaveAttribute("data-flat", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      state === "error" ? "Competition unavailable" : "Loading competition"
    );
    expect(screen.queryByTestId("native")).toBeNull();
    expect(screen.queryByText("Direct legacy content")).toBeNull();
    // Retry refreshes the wave, hub and selected record together, even when
    // only one read failed, to recover a coherent authorized presentation.
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mockWaveQuery.refetch).toHaveBeenCalledTimes(1);
    expect(mockHubQuery.refetch).toHaveBeenCalledTimes(1);
    expect(mockCompetitionQuery.refetch).toHaveBeenCalledTimes(1);
  }
);

it("preserves the shell when selected data finishes loading", () => {
  const competition = mockCompetitionQuery.data;
  mockCompetitionQuery.data = undefined;
  const { rerender } = render(routeTree());
  const shell = screen.getByTestId("persistent-shell");
  const wave = screen.getByTestId("wave");
  mockCompetitionQuery.data = competition;
  rerender(routeTree());
  expect(screen.getByTestId("persistent-shell")).toBe(shell);
  expect(screen.getByTestId("wave")).toBe(wave);
  expect(screen.getByTestId("native")).toBeVisible();
});

it.each([undefined, 429, 500, 503])(
  "preserves cached form and shell during a background failure (%s)",
  (status) => {
    const { rerender } = render(routeTree());
    const shell = screen.getByTestId("persistent-shell");
    const wave = screen.getByTestId("wave");
    const input = screen.getByLabelText("Entry text");
    fireEvent.change(input, { target: { value: "Unfinished entry" } });
    for (const result of [mockWaveQuery, mockHubQuery, mockCompetitionQuery]) {
      result.isError = true;
      result.error = status === undefined ? new Error("Offline") : { status };
    }
    rerender(routeTree());
    expect(screen.getByTestId("persistent-shell")).toBe(shell);
    expect(screen.getByTestId("wave")).toBe(wave);
    expect(screen.getByLabelText("Entry text")).toBe(input);
    expect(input).toHaveValue("Unfinished entry");
    expect(screen.queryByRole("status")).toBeNull();
  }
);

it.each([401, 403, 404])(
  "revokes cached competition content after an access rejection (%s)",
  (status) => {
    const { rerender } = render(routeTree());
    const shell = screen.getByTestId("persistent-shell");
    mockCompetitionQuery.isError = true;
    mockCompetitionQuery.error = { status };
    rerender(routeTree());
    expect(screen.getByTestId("persistent-shell")).toBe(shell);
    expect(screen.queryByLabelText("Entry text")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Competition unavailable"
    );
    expect(shell).toHaveAttribute("data-ready", "false");
    expect(shell).toHaveAttribute("data-native", "");
  }
);

it.each([
  ["wave", 401],
  ["wave", 403],
  ["wave", 404],
  ["hub", 401],
  ["hub", 403],
  ["hub", 404],
] as const)(
  "revokes cached content when its %s read rejects access with %s",
  (source, status) => {
    const { rerender } = render(routeTree());
    const result = source === "wave" ? mockWaveQuery : mockHubQuery;
    result.isError = true;
    result.error = { status };
    rerender(routeTree());
    expect(screen.queryByTestId("native")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Competition unavailable"
    );
  }
);

it("preserves a mounted form when an implicit command pins its URL", () => {
  mockSearch = "default=1";
  const { rerender } = render(routeTree());
  const input = screen.getByLabelText("Entry text");
  fireEvent.change(input, { target: { value: "Unfinished entry" } });
  mockSearch = "";
  rerender(routeTree());
  expect(screen.getByLabelText("Entry text")).toBe(input);
  expect(input).toHaveValue("Unfinished entry");
});

it("resets the previous viewer's form while retaining the persistent shell", () => {
  const { rerender } = render(routeTree());
  const shell = screen.getByTestId("persistent-shell");
  const input = screen.getByLabelText("Entry text");
  fireEvent.change(input, { target: { value: "Previous viewer" } });
  mockViewer = "other-member";
  mockCompetitionQuery.data = undefined;
  rerender(routeTree());
  expect(screen.getByTestId("persistent-shell")).toBe(shell);
  expect(screen.queryByLabelText("Entry text")).toBeNull();
  mockCompetitionQuery.data = {
    id: "alpha",
    wave_id: "wave",
    lifecycle: "PUBLISHED",
  };
  rerender(routeTree());
  expect(screen.getByLabelText("Entry text")).not.toBe(input);
  expect(screen.getByLabelText("Entry text")).toHaveValue("");
});

it("does not reuse cached selected data when the wave or competition changes", () => {
  const { rerender } = render(routeTree());
  const shell = screen.getByTestId("persistent-shell");
  const input = screen.getByLabelText("Entry text");
  fireEvent.change(input, { target: { value: "Previous wave submission" } });
  mockPathname = "/waves/other-wave/competitions/beta";
  rerender(routeTree("beta", "other-wave"));
  expect(screen.getByTestId("persistent-shell")).toBe(shell);
  expect(shell).toHaveAttribute("data-ready", "false");
  expect(screen.queryByTestId("native")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent("Loading competition");
  mockWaveQuery.data = { id: "other-wave" };
  mockHubQuery.data = {
    id: "other-wave",
    legacy_primary_competition_id: null,
  };
  mockCompetitionQuery.data = {
    id: "beta",
    wave_id: "other-wave",
    lifecycle: "PUBLISHED",
  };
  rerender(routeTree("beta", "other-wave"));
  expect(screen.getByTestId("native")).toBeVisible();
  expect(screen.getByLabelText("Entry text")).not.toBe(input);
  expect(screen.getByLabelText("Entry text")).toHaveValue("");
});

it("preserves draft presentation after publication until leaving the visit", () => {
  mockCompetitionQuery.data!.lifecycle = "DRAFT";
  const { rerender } = render(routeTree());
  const shell = screen.getByTestId("persistent-shell");
  const detail = screen.getByTestId("detail");
  expect(shell).toHaveAttribute("data-flat", "false");
  mockCompetitionQuery.data = {
    ...mockCompetitionQuery.data!,
    lifecycle: "PUBLISHED",
  };
  mockSearch = "edit=1";
  rerender(routeTree());
  expect(screen.getByTestId("detail")).toBe(detail);
  expect(shell).toHaveAttribute("data-flat", "false");
  mockPathname = "/waves/wave";
  rerender(routeTree(null));
  expect(screen.getByTestId("persistent-shell")).toBe(shell);
  expect(shell).toHaveAttribute("data-ready", "false");
  mockPathname = "/waves/wave/competitions/alpha";
  mockSearch = "";
  rerender(routeTree());
  expect(screen.getByTestId("native")).toBeVisible();
  expect(shell).toHaveAttribute("data-flat", "true");
});

it.each([
  "/waves",
  "/waves/wave",
  "/waves/create",
  "/waves/wave/competitions/new",
])("does not fetch a selected competition on %s", (pathname) => {
  mockPathname = pathname;
  render(routeTree(null));
  expect(useWaveData).toHaveBeenCalledWith({
    waveId: null,
  });
  expect(useCompetitionHub).toHaveBeenCalledWith("", false);
  expect(useCompetitionDetail).toHaveBeenCalledWith(
    { waveId: "", competitionId: "" },
    false
  );
  expect(useDefaultCompetition).toHaveBeenCalledWith("", false);
  expect(screen.getByTestId("persistent-shell")).toHaveAttribute(
    "data-ready",
    "false"
  );
});

it("waits for a fresh default before exposing a marked remembered competition", () => {
  mockSearch = "tab=leaderboard&restore=1";
  mockSelectionQuery.isFetchedAfterMount = false;
  mockSelectionQuery.isFetching = true;
  const { rerender } = render(routeTree());
  const shell = screen.getByTestId("persistent-shell");
  expect(useDefaultCompetition).toHaveBeenCalledWith("wave", true);
  expect(screen.queryByTestId("native")).toBeNull();
  expect(shell).toHaveAttribute("data-flat", "true");
  expect(screen.getByRole("status")).toHaveTextContent("Loading competition");
  mockSelectionQuery.isFetching = false;
  rerender(routeTree());
  expect(screen.queryByTestId("native")).toBeNull();
  mockSelectionQuery.isFetchedAfterMount = true;
  rerender(routeTree());
  expect(screen.getByTestId("persistent-shell")).toBe(shell);
  expect(screen.getByTestId("native")).toBeVisible();
});

it("never exposes the remembered competition when the fresh default is different", () => {
  mockSearch = "tab=leaderboard&restore=1";
  mockSelectionQuery.data = { competition_id: "beta" };
  render(routeTree());
  expect(screen.queryByTestId("native")).toBeNull();
  expect(screen.getByTestId("persistent-shell")).toHaveAttribute(
    "data-ready",
    "false"
  );
  expect(screen.getByRole("status")).toHaveTextContent("Loading competition");
});

it.each([401, 403, 404])(
  "rejects matching cached restoration after a fresh selection denial (%s)",
  (status) => {
    mockSearch = "tab=leaderboard&restore=1";
    mockSelectionQuery.isError = true;
    mockSelectionQuery.error = { status };
    render(routeTree());
    expect(screen.queryByTestId("native")).toBeNull();
    expect(screen.getByTestId("persistent-shell")).toHaveAttribute(
      "data-ready",
      "false"
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Competition unavailable"
    );
  }
);

it("uses a same-ID cached selection after a transient restoration fetch fails", () => {
  mockSearch = "tab=leaderboard&restore=1";
  mockSelectionQuery.isFetchedAfterMount = false;
  mockSelectionQuery.isError = true;
  mockSelectionQuery.error = { status: 503 };
  render(routeTree());
  expect(screen.getByTestId("native")).toBeVisible();
});

it("preserves unmarked explicit competition links when the default differs", () => {
  mockSelectionQuery.data = { competition_id: "beta" };
  mockSelectionQuery.isFetching = true;
  render(routeTree());
  expect(useDefaultCompetition).toHaveBeenCalledWith("wave", false);
  expect(screen.getByTestId("native")).toBeVisible();
});

it("retries default resolution alongside selected data for a marked restoration", () => {
  mockSearch = "tab=leaderboard&restore=1";
  mockSelectionQuery.data = undefined;
  mockSelectionQuery.isError = true;
  mockSelectionQuery.error = { status: 503 };
  render(routeTree());
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(mockSelectionQuery.refetch).toHaveBeenCalledTimes(1);
});
