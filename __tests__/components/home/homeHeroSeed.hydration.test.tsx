jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
jest.mock("@/lib/fetch/ssrFetch", () => ({ SSR_API_TIMEOUT_MS: 4500 }));

const mockCommonApiFetch = jest.fn();
const mockFetchWaveDecisionsV2 = jest.fn();
const mockFetchUrl = jest.fn();

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => mockCommonApiFetch(...args),
}));

jest.mock("@/services/api/wave-decisions-v2-api", () => ({
  ...jest.requireActual("@/services/api/wave-decisions-v2-api"),
  fetchWaveDecisionsV2: (...args: unknown[]) =>
    mockFetchWaveDecisionsV2(...args),
}));

// The settings provider's own request.
jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: unknown[]) => mockFetchUrl(...args),
}));

jest.mock("@/helpers/waves/wave.helpers", () => ({
  ...jest.requireActual("@/helpers/waves/wave.helpers"),
  toApiWaveMin: (wave: { readonly id: string }) => ({ id: wave.id }),
}));

import { startHomeHeroData } from "@/app/(home)/home-hero-data.server";
import HomeHeroSeed, {
  type HomeHeroData,
} from "@/components/home/now-minting/HomeHeroSeed";
import { SeizeSettingsProvider } from "@/contexts/SeizeSettingsContext";
import { resolveMemesWaveId } from "@/helpers/seize-settings.helpers";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMinting } from "@/hooks/useNowMinting";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

const MEMES_WAVE_ID = resolveMemesWaveId("api-memes-wave") ?? "api-memes-wave";
const WAVE_ENDPOINT = `waves/${MEMES_WAVE_ID}`;
const settings = { memes_wave_id: "api-memes-wave" };
const meme = { id: 512, name: "Latest" };
const wave = { id: MEMES_WAVE_ID, name: "The Memes" };
const decisionsPage = {
  data: [
    {
      decision_time: 1,
      winners: [
        {
          place: 1,
          awards: [],
          drop: { id: "next-drop", title: "Next", metadata: [] },
        },
      ],
    },
  ],
  count: 1,
  page: 1,
  next: false,
};

const respondFromApi = ({ endpoint }: { readonly endpoint: string }) => {
  if (endpoint === "memes_latest") return Promise.resolve(meme);
  if (endpoint === "settings") return Promise.resolve(settings);
  if (endpoint === WAVE_ENDPOINT) return Promise.resolve(wave);
  return Promise.reject(new Error(endpoint));
};

function HeroProbe() {
  const { nft } = useNowMinting();
  const { nextMint, isSettingsLoaded } = useNextMintDrop();
  return (
    <output>
      {[nft?.id ?? "none", nextMint?.id ?? "none", isSettingsLoaded].join("|")}
    </output>
  );
}

// The page's client tree: the seed, then the Latest Drop that reads it.
function HomeTree({
  queryClient,
  data,
}: {
  readonly queryClient: QueryClient;
  readonly data: HomeHeroData;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SeizeSettingsProvider>
        <HomeHeroSeed data={data} />
        <HeroProbe />
      </SeizeSettingsProvider>
    </QueryClientProvider>
  );
}

// The app client's default decides whether the adopted Meme is still fresh.
const createBrowserClient = () =>
  new QueryClient({
    defaultOptions: { queries: { staleTime: 10_000, retry: false } },
  });

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const apiEndpoints = () =>
  mockCommonApiFetch.mock.calls.map(
    ([call]) => (call as { readonly endpoint: string }).endpoint
  );

describe("home hero server data", () => {
  let container: HTMLDivElement;
  let root: Root | undefined;

  beforeEach(() => {
    mockCommonApiFetch.mockReset();
    mockFetchWaveDecisionsV2.mockReset();
    mockFetchUrl.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    container.remove();
  });

  const hydrate = async (data: HomeHeroData) => {
    const onRecoverableError = jest.fn();
    await act(async () => {
      root = hydrateRoot(
        container,
        <HomeTree queryClient={createBrowserClient()} data={data} />,
        { onRecoverableError }
      );
    });
    await settle();
    return onRecoverableError;
  };

  it("keeps the server HTML free of hero data, then adopts the server requests", async () => {
    mockCommonApiFetch.mockImplementation(respondFromApi);
    mockFetchWaveDecisionsV2.mockResolvedValue(decisionsPage);
    // The provider's own request stays open: the seed must not wait for it.
    mockFetchUrl.mockReturnValue(new Promise(() => undefined));

    const data = startHomeHeroData();
    await data.nextMintDecisions;
    container.innerHTML = renderToString(
      <HomeTree queryClient={new QueryClient()} data={data} />
    );

    // The server HTML matches a render without any of this data, so nothing
    // that depends on it (purchase surfaces included) is in the HTML.
    expect(container.textContent).toBe("none|none|false");
    expect(apiEndpoints()).toEqual(["memes_latest", "settings", WAVE_ENDPOINT]);
    expect(mockFetchWaveDecisionsV2).toHaveBeenCalledTimes(1);
    mockCommonApiFetch.mockClear();
    mockFetchWaveDecisionsV2.mockClear();

    const onRecoverableError = await hydrate(data);

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe("512|next-drop|true");
    expect(mockCommonApiFetch).not.toHaveBeenCalled();
    expect(mockFetchWaveDecisionsV2).not.toHaveBeenCalled();
  });

  it("joins wave requests the server has not finished", async () => {
    mockCommonApiFetch.mockImplementation(respondFromApi);
    let finishDecisions!: (page: typeof decisionsPage) => void;
    mockFetchWaveDecisionsV2.mockReturnValue(
      new Promise((resolve) => {
        finishDecisions = resolve;
      })
    );
    mockFetchUrl.mockReturnValue(new Promise(() => undefined));

    const data = startHomeHeroData();
    await data.memesWave;
    container.innerHTML = renderToString(
      <HomeTree queryClient={new QueryClient()} data={data} />
    );
    mockCommonApiFetch.mockClear();
    mockFetchWaveDecisionsV2.mockClear();

    await hydrate(data);

    expect(container.textContent).toBe("512|none|true");
    await act(async () => finishDecisions(decisionsPage));
    await settle();

    expect(container.textContent).toBe("512|next-drop|true");
    expect(mockCommonApiFetch).not.toHaveBeenCalled();
    expect(mockFetchWaveDecisionsV2).not.toHaveBeenCalled();
  });

  it("falls back to browser requests when the server ones failed", async () => {
    mockCommonApiFetch.mockRejectedValue(new Error("API unavailable"));
    const data = startHomeHeroData();
    await data.nextMintDecisions;
    container.innerHTML = renderToString(
      <HomeTree queryClient={new QueryClient()} data={data} />
    );

    mockCommonApiFetch.mockReset();
    mockCommonApiFetch.mockImplementation(respondFromApi);
    mockFetchWaveDecisionsV2.mockResolvedValue(decisionsPage);
    mockFetchUrl.mockResolvedValue(settings);

    await hydrate(data);
    await settle();

    expect(container.textContent).toBe("512|next-drop|true");
    // One request each: the seed and the Latest Drop share the Meme request.
    expect(apiEndpoints()).toEqual(["memes_latest", WAVE_ENDPOINT]);
    expect(mockFetchWaveDecisionsV2).toHaveBeenCalledTimes(1);
    expect(mockFetchUrl).toHaveBeenCalledTimes(1);
  });
});
