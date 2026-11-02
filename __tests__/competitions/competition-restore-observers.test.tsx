import { useEffect } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/__tests__/utils/reactQuery";
import {
  CompetitionRouteProvider,
  useCompetitionRoute,
} from "@/contexts/CompetitionRouteContext";
import { MyStreamWaveTabs } from "@/components/brain/my-stream/tabs/MyStreamWaveTabs";
import { useCompetitionSubmissionWave } from "@/hooks/competitions/useCompetitionSubmissionWave";
import {
  useCompetitionPauseState,
  useCompetitionResource,
} from "@/hooks/competitions/useCompetitionQueries";
import {
  competitionQueryKey,
  defaultCompetitionQueryKey,
  fetchCompetition,
  fetchCompetitionHub,
  fetchCompetitionPauseState,
  fetchCompetitionResource,
  fetchDefaultCompetition,
} from "@/services/api/competitions-api";
import { useDefaultCompetitionNavigation } from "@/hooks/competitions/useDefaultCompetitionNavigation";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiDefaultCompetition } from "@/generated/models/ApiDefaultCompetition";

let mockSearch = "tab=leaderboard&restore=1";
const mockListeners = new Set<() => void>();
const mockReplace = jest.fn();
const mockSynchronizedUrl = jest.fn();
const mockRegisterRef = jest.fn();
const mockWave = {
  id: "wave",
  chat: { scope: { group: null } },
} as ApiWave;
const mockCompetition = {
  id: "alpha",
  wave_id: "wave",
  lifecycle: "PUBLISHED",
} as ApiCompetition;

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave/competitions/alpha",
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => {
    const React = jest.requireActual("react");
    const search = React.useSyncExternalStore(
      (listener: () => void) => {
        mockListeners.add(listener);
        return () => mockListeners.delete(listener);
      },
      () => mockSearch
    );
    return React.useMemo(() => new URLSearchParams(search), [search]);
  },
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null, activeProfileProxy: null }),
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: mockWave, refetch: jest.fn() }),
}));
jest.mock("@/hooks/useWave", () => ({
  useWave: () => ({ isMemesWave: true }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef: mockRegisterRef }),
}));
jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({ availableTabs: ["CHAT", "LEADERBOARD"] }),
}));
jest.mock("@/helpers/competition-presentation.helpers", () => ({
  presentationCompetition: (wave: { competition?: ApiCompetition }) =>
    wave?.competition ?? null,
  competitionPresentationWave: (
    wave: ApiWave,
    competition: ApiCompetition
  ) => ({ ...wave, competition }),
}));
// Both real header variants mount DesktopTabs, which observes the default.
// Keep that real query lifecycle while omitting unrelated header controls.
jest.mock("@/components/brain/my-stream/tabs/MyStreamWaveTabsMeme", () => {
  const { useDefaultCompetition } = jest.requireActual(
    "@/hooks/competitions/useCompetitionQueries"
  );
  return function MemeHeader() {
    useDefaultCompetition("wave");
    return <div data-testid="meme-header" />;
  };
});
jest.mock("@/components/brain/my-stream/tabs/MyStreamWaveTabsDefault", () => {
  const { useDefaultCompetition } = jest.requireActual(
    "@/hooks/competitions/useCompetitionQueries"
  );
  return function DefaultHeader() {
    useDefaultCompetition("wave");
    return <div data-testid="default-header" />;
  };
});
jest.mock("@/services/api/competitions-api", () => ({
  ...jest.requireActual("@/services/api/competitions-api"),
  fetchCompetition: jest.fn(),
  fetchCompetitionHub: jest.fn(),
  fetchDefaultCompetition: jest.fn(),
  fetchCompetitionPauseState: jest.fn(),
  fetchCompetitionResource: jest.fn(),
}));

const identity = { waveId: "wave", competitionId: "alpha" };
const selection = (competitionId: string | null = "alpha") => ({
  competition_id: competitionId,
  evaluated_at: 1,
  next_refresh_at: null,
});
const mount = jest.fn();
const unmount = jest.fn();
const aborted = jest.fn();
function NativeContent() {
  useCompetitionPauseState(identity);
  useCompetitionResource(identity, "leaderboard");
  useEffect(() => {
    mount();
    return () => unmount();
  }, []);
  return <input aria-label="Native draft" defaultValue="" />;
}
function Shell() {
  const route = useCompetitionRoute();
  const target = useCompetitionSubmissionWave(mockWave);
  useDefaultCompetitionNavigation(mockWave, true);
  return (
    <>
      <MyStreamWaveTabs
        wave={mockWave}
        competitionSubmissionReady={Boolean(target.wave)}
        viewMode="chat"
        onToggleViewMode={() => {}}
        showGalleryToggle={false}
      />
      {route.value ? (
        <NativeContent />
      ) : (
        <p role={route.error ? "alert" : "status"}>Validating selection</p>
      )}
    </>
  );
}

let client: ReturnType<typeof createTestQueryClient>;
let defaults: {
  resolve: (value: ApiDefaultCompetition) => void;
  reject: (error: unknown) => void;
}[];
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockSearch = "tab=leaderboard&restore=1";
  defaults = [];
  const replace = window.history.replaceState.bind(window.history);
  replace(
    {
      __NA: true,
      routerSentinel: "old",
      waveInformation: "keep",
      waveInformationView: "about",
      waveInformationViewTitle: "Wave information",
      waveTabSelection: {
        waveId: "wave",
        value: { tab: "LEADERBOARD", competitionId: "alpha" },
      },
      customMetadata: { preserved: true },
    },
    "",
    `/waves/wave/competitions/alpha?${mockSearch}`
  );
  // Model the installed Next history integration: internal-state writes bypass
  // URL-hook synchronization; external URL writes sync and retain router state.
  jest
    .spyOn(window.history, "replaceState")
    .mockImplementation((state, unused, url) => {
      const internal = state?.__NA || state?._N;
      replace(
        internal ? state : { ...state, __NA: true, routerSentinel: "fresh" },
        unused,
        url
      );
      if (url && !internal) {
        mockSynchronizedUrl(url);
        mockSearch = new URL(window.location.href).search.slice(1);
        mockListeners.forEach((listener) => listener());
      }
    });
  client = createTestQueryClient();
  client.setQueryData(defaultCompetitionQueryKey("wave", null), selection());
  client.setQueryData(
    [QueryKey.COMPETITION_HUB, { wave_id: "wave", viewer: null }],
    { id: "wave" }
  );
  client.setQueryData(competitionQueryKey(identity, null), mockCompetition);
  jest.mocked(fetchCompetition).mockResolvedValue(mockCompetition);
  jest.mocked(fetchCompetitionHub).mockResolvedValue({ id: "wave" } as never);
  jest
    .mocked(fetchDefaultCompetition)
    .mockImplementation(
      () => new Promise((resolve, reject) => defaults.push({ resolve, reject }))
    );
  const pendingResource = (signal?: AbortSignal) =>
    new Promise<never>((_resolve, reject) => {
      signal?.addEventListener("abort", () => {
        aborted();
        reject(new DOMException("Canceled", "AbortError"));
      });
    });
  jest
    .mocked(fetchCompetitionPauseState)
    .mockImplementation((_identity, signal) => pendingResource(signal));
  jest
    .mocked(fetchCompetitionResource)
    .mockImplementation((_identity, _resource, _params, signal) =>
      pendingResource(signal)
    );
});
afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});
function renderRoute() {
  return render(
    <QueryClientProvider client={client}>
      <CompetitionRouteProvider>
        <Shell />
      </CompetitionRouteProvider>
    </QueryClientProvider>
  );
}

it("validates a remembered visit once, retaining native content through observer refreshes", async () => {
  const historyLength = window.history.length;
  renderRoute();
  expect(screen.queryByRole("textbox")).toBeNull();
  await waitFor(() => expect(defaults).toHaveLength(1));
  await act(async () => defaults[0]!.resolve(selection()));
  await waitFor(() => expect(mount).toHaveBeenCalledTimes(1));
  expect({
    reads: defaults.length,
    unmounts: unmount.mock.calls.length,
    aborted: aborted.mock.calls.length,
  }).toEqual({ reads: 1, unmounts: 0, aborted: 0 });
  const input = screen.getByRole("textbox", { name: "Native draft" });
  expect(mockSearch).toBe("tab=leaderboard");
  expect(window.location.search).toBe("?tab=leaderboard");
  expect(window.history.length).toBe(historyLength);
  expect(mockSynchronizedUrl).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
  expect(window.history.state).toMatchObject({
    waveInformation: "keep",
    waveInformationView: "about",
    waveInformationViewTitle: "Wave information",
    waveTabSelection: {
      waveId: "wave",
      value: { tab: "LEADERBOARD", competitionId: "alpha" },
    },
    customMetadata: { preserved: true },
    routerSentinel: "fresh",
  });
  fireEvent.change(input, { target: { value: "Keep this draft" } });
  act(() => {
    void client.refetchQueries({
      queryKey: defaultCompetitionQueryKey("wave", null),
    });
  });
  await waitFor(() => expect(defaults).toHaveLength(2));
  expect(screen.getByRole("textbox")).toBe(input);
  expect(mockSynchronizedUrl).toHaveBeenCalledTimes(1);
  expect(input).toHaveValue("Keep this draft");
  expect(aborted).not.toHaveBeenCalled();
  await act(async () => defaults[1]!.resolve(selection()));
  await waitFor(() => expect(client.isFetching()).toBe(2));
  expect(defaults).toHaveLength(2);
  expect(mount).toHaveBeenCalledTimes(1);
  expect(unmount).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox")).toBe(input);
});

it.each(["beta", null, 401, 403, 404])(
  "does not expose a cached remembered competition after fresh selection %s",
  async (result) => {
    renderRoute();
    await waitFor(() => expect(defaults).toHaveLength(1));
    await act(async () => {
      if (typeof result === "number") defaults[0]!.reject({ status: result });
      else defaults[0]!.resolve(selection(result));
    });
    if (typeof result === "number")
      expect(await screen.findByRole("alert")).toBeVisible();
    else
      await waitFor(() =>
        expect(mockReplace).toHaveBeenCalledWith("/waves/wave?tab=chat", {
          scroll: false,
        })
      );
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(mount).not.toHaveBeenCalled();
  }
);
