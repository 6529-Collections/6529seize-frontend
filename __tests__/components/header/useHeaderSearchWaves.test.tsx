import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { useHeaderSearchWaves } from "@/components/header/header-search/header-search-modal/useHeaderSearchWaves";
import { searchWavesByName } from "@/services/api/waves-v2-api";
import type { SidebarWave } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const mockAuth = jest.fn();
const mockWallet = jest.fn();
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockWallet(),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () =>
  jest.requireActual("@/components/react-query-wrapper/query-keys")
);
jest.mock("@/services/api/waves-v2-api", () => ({
  searchWavesByName: jest.fn(),
}));

const searchMock = jest.mocked(searchWavesByName);

const resultWave = (id: string): SidebarWave => ({
  id,
  name: id,
  type: ApiWaveType.Chat,
  createdAt: 0,
  creator: null,
  picture: null,
  contributors: [],
  isDirectMessage: false,
  hasCompetition: false,
  parentWaveId: null,
  hasSubwaves: false,
  descriptionDrop: { contents: null, media: [] },
  totalDropsCount: 0,
  isPrivate: true,
  latestDropTimestamp: null,
  latestFollowedSubwaveDropTimestamp: null,
  firstUnreadDropSerialNo: null,
  firstUnreadFollowedSubwaveDropSerialNo: null,
  unreadDropsCount: 0,
  followedSubwavesCount: 0,
  unreadSubwaveDrops: 0,
  latestReadTimestamp: 0,
  pinned: false,
  muted: false,
  subscribed: false,
  waveRep: null,
  waveScore: null,
});

function deferredSearch() {
  let resolve!: (waves: SidebarWave[]) => void;
  const promise = new Promise<SidebarWave[]>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(
    ({ name, enabled }) => useHeaderSearchWaves(name, enabled),
    { wrapper, initialProps: { name: "alpha", enabled: true } }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockReturnValue({ connectedProfile: null });
  mockWallet.mockReturnValue({ address: undefined });
  searchMock.mockResolvedValue([]);
});

it("starts immediately for a settled query and ignores late previous-query results", async () => {
  const alpha = deferredSearch();
  const beta = deferredSearch();
  searchMock
    .mockReturnValueOnce(alpha.promise)
    .mockReturnValueOnce(beta.promise);
  const { result, rerender } = setup();
  expect(searchMock).toHaveBeenCalledWith({ name: "alpha", pageSize: 20 });
  rerender({ name: "beta", enabled: true });
  expect(searchMock).toHaveBeenCalledWith({ name: "beta", pageSize: 20 });
  const betaResults = [resultWave("beta")];
  await act(async () => beta.resolve(betaResults));
  await waitFor(() => expect(result.current.waves).toBe(betaResults));
  await act(async () => alpha.resolve([resultWave("alpha")]));
  expect(result.current.waves).toBe(betaResults);
});

it.each([
  { address: "0xbb", handle: "beta", proxy: undefined },
  { address: "0xaa", handle: "alpha", proxy: { id: "proxy-1" } },
  { address: "0xaa", handle: "renamed", proxy: undefined },
])(
  "does not reuse another viewer's cached results: %o",
  async ({ address, handle, proxy }) => {
    mockAuth.mockReturnValue({
      connectedProfile: { handle: "alpha" },
      isAuthenticated: true,
    });
    mockWallet.mockReturnValue({ address: "0xaa", hasValidWalletAuth: true });
    const previousResults = [resultWave("previous-viewer")];
    searchMock.mockResolvedValueOnce(previousResults);
    const { result, rerender } = setup();
    await waitFor(() => expect(result.current.waves).toBe(previousResults));

    const next = deferredSearch();
    searchMock.mockReturnValueOnce(next.promise);
    mockAuth.mockReturnValue({
      connectedProfile: { handle },
      isAuthenticated: true,
      activeProfileProxy: proxy,
    });
    mockWallet.mockReturnValue({ address, hasValidWalletAuth: true });
    rerender({ name: "alpha", enabled: true });
    expect(result.current.waves).not.toBe(previousResults);
    expect(searchMock).toHaveBeenCalledTimes(2);
    const nextResults = [resultWave("next-viewer")];
    await act(async () => next.resolve(nextResults));
    await waitFor(() => expect(result.current.waves).toBe(nextResults));
  }
);

it.each(["disabled", "fetching-profile", "invalid-wallet"])(
  "masks cached results and prevents retry while %s",
  async (state) => {
    mockAuth.mockReturnValue({
      connectedProfile: { handle: "alpha" },
      isAuthenticated: true,
    });
    mockWallet.mockReturnValue({ address: "0xaa", hasValidWalletAuth: true });
    const cachedResults = [resultWave("cached-private")];
    searchMock.mockResolvedValueOnce(cachedResults);
    const { result, rerender } = setup();
    await waitFor(() => expect(result.current.waves).toBe(cachedResults));
    mockAuth.mockReturnValue({
      connectedProfile: { handle: "alpha" },
      isAuthenticated: true,
      fetchingProfile: state === "fetching-profile",
    });
    mockWallet.mockReturnValue({
      address: "0xaa",
      hasValidWalletAuth: state !== "invalid-wallet",
    });
    rerender({ name: "alpha", enabled: state !== "disabled" });
    expect(result.current.waves).not.toBe(cachedResults);
    expect(result.current.waves).toEqual([]);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.error).toBeNull();
    await act(async () => {
      await result.current.refetch();
    });
    expect(searchMock).toHaveBeenCalledTimes(1);
  }
);
