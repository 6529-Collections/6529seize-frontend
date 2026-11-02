import { renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ViewProvider } from "@/components/navigation/ViewContext";
import {
  CompetitionRouteProvider,
  useCompetitionRoute,
} from "@/contexts/CompetitionRouteContext";
import {
  createTestQueryClient,
  renderWithQueryClient,
} from "@/__tests__/utils/reactQuery";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveQueryKey } from "@/services/api/wave-query";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { sessionAwareFetch } from "@/services/api/session-aware-fetch";
import { useWaveData } from "@/hooks/useWaveData";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/waves/wave/competitions/alpha",
  useSearchParams: () => new URLSearchParams("tab=leaderboard"),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => ({ activeWave: { id: "wave" } }),
}));
jest.mock("@/services/api/session-aware-fetch", () => ({
  sessionAwareFetch: jest.fn(),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => null,
  useCompetitionHub: () => ({
    data: { id: "wave", legacy_primary_competition_id: null },
    error: null,
    isError: false,
    refetch: jest.fn(),
  }),
  useCompetitionDetail: () => ({
    data: { id: "alpha", wave_id: "wave", lifecycle: "PUBLISHED" },
    error: null,
    isError: false,
    refetch: jest.fn(),
  }),
  useDefaultCompetition: () => ({ refetch: jest.fn() }),
}));

const fetchMock = jest.mocked(sessionAwareFetch);
let client: QueryClient;
const wave = {
  id: "wave",
  chat: { scope: { group: { is_direct_message: false } } },
} as ApiWave;

function RouteContent() {
  const route = useCompetitionRoute();
  return route.value ? (
    <p>Cached competition content</p>
  ) : (
    <p role="alert">Competition unavailable</p>
  );
}

const failureResponse = (status: number) =>
  ({
    ok: false,
    status,
    statusText: "Request failed",
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => JSON.stringify({ message: "Wave unavailable" }),
  }) as Response;

beforeEach(() => {
  client = createTestQueryClient({
    defaultOptions: { queries: { refetchOnMount: false } },
  });
  fetchMock.mockReset();
});

afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

it.each([401, 403, 404, 429, 503])(
  "retains HTTP %s from navigation classification in the shared cache and applies its content policy",
  async (status) => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const key = getWaveQueryKey("wave");
    // The imperative navigation read must refetch this old successful value.
    client.setQueryData(key, wave, { updatedAt: Date.now() - 60_001 });
    fetchMock.mockResolvedValue(failureResponse(status));
    const { rerender } = renderWithQueryClient(
      <ViewProvider>{null}</ViewProvider>,
      {
        queryClient: client,
      }
    );
    await waitFor(() =>
      expect(client.getQueryState(key)?.status).toBe("error")
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getStructuredApiErrorStatus(client.getQueryState(key)?.error)).toBe(
      status
    );
    expect(client.getQueryData(key)).toBe(wave);

    rerender(
      <ViewProvider>
        <CompetitionRouteProvider>
          <RouteContent />
        </CompetitionRouteProvider>
      </ViewProvider>
    );
    if (status === 429 || status >= 500) {
      expect(screen.getByText("Cached competition content")).toBeVisible();
      expect(screen.queryByRole("alert")).toBeNull();
    } else {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Competition unavailable"
      );
      expect(screen.queryByText("Cached competition content")).toBeNull();
    }
    // The selected route consumes the imperative read's cached status directly.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }
);

it.each([401, 403, 404])(
  "does not retry a real shared-query HTTP %s and only reports a missing wave for 404",
  async (status) => {
    const onWaveNotFound = jest.fn();
    fetchMock.mockResolvedValue(failureResponse(status));
    const { result } = renderHook(
      () => useWaveData({ waveId: "wave", onWaveNotFound }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      }
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getStructuredApiErrorStatus(result.current.error)).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onWaveNotFound).toHaveBeenCalledTimes(status === 404 ? 1 : 0);
  }
);
