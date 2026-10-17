jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
jest.mock("@/lib/fetch/ssrFetch", () => ({ SSR_API_TIMEOUT_MS: 4500 }));

const mockCommonApiFetch = jest.fn();

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => mockCommonApiFetch(...args),
}));

import { startHomeHeroData } from "@/app/(home)/home-hero-data.server";
import { resolveMemesWaveId } from "@/helpers/seize-settings.helpers";
import { NEXT_MINT_DECISIONS_PAGE_SIZE } from "@/services/api/latest-drop-query";

type ApiCall = {
  readonly endpoint: string;
  readonly params?: Record<string, string>;
  readonly signal?: AbortSignal;
};

type Responder = (call: ApiCall) => Promise<unknown>;

const MEMES_WAVE_ID = resolveMemesWaveId("api-memes-wave") ?? "api-memes-wave";
const WAVE_ENDPOINT = `waves/${MEMES_WAVE_ID}`;
const DECISIONS_ENDPOINT = `v2/waves/${MEMES_WAVE_ID}/decisions`;
const meme = { id: 512, name: "Latest" };
const settings = { memes_wave_id: "api-memes-wave" };
const wave = { id: MEMES_WAVE_ID, name: "The Memes" };
const decisionsPage = { data: [], count: 0, page: 1, next: false };

const deferred = () => {
  let resolve!: (value: unknown) => void;
  const promise = new Promise<unknown>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const calls = (): ApiCall[] =>
  mockCommonApiFetch.mock.calls.map(([call]) => call as ApiCall);

const endpoints = () => calls().map((call) => call.endpoint);

const callFor = (endpoint: string) =>
  calls().find((call) => call.endpoint === endpoint);

const respondWith = (responders: Record<string, Responder>) => {
  mockCommonApiFetch.mockImplementation((call: ApiCall) => {
    const responder = responders[call.endpoint];
    return responder
      ? responder(call)
      : Promise.reject(new Error(call.endpoint));
  });
};

const successful = (): Record<string, Responder> => ({
  memes_latest: async () => meme,
  settings: async () => settings,
  [WAVE_ENDPOINT]: async () => wave,
  [DECISIONS_ENDPOINT]: async () => decisionsPage,
});

describe("startHomeHeroData", () => {
  beforeEach(() => {
    mockCommonApiFetch.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts the Meme and settings together, then the wave and decision together", async () => {
    const settingsResponse = deferred();
    const waveResponse = deferred();
    respondWith({
      ...successful(),
      settings: () => settingsResponse.promise,
      [WAVE_ENDPOINT]: () => waveResponse.promise,
    });

    const data = startHomeHeroData();

    expect(endpoints()).toEqual(["memes_latest", "settings"]);
    await expect(data.latestMeme).resolves.toEqual(meme);

    settingsResponse.resolve(settings);
    await expect(data.settings).resolves.toEqual(settings);
    await settle();

    // The decision request does not wait for the wave response.
    expect(endpoints()).toEqual([
      "memes_latest",
      "settings",
      WAVE_ENDPOINT,
      DECISIONS_ENDPOINT,
    ]);
    expect(callFor(DECISIONS_ENDPOINT)?.params).toEqual({
      sort_direction: "DESC",
      sort: "decision_time",
      page: "1",
      page_size: String(NEXT_MINT_DECISIONS_PAGE_SIZE),
    });
    await expect(data.nextMintDecisions).resolves.toEqual(decisionsPage);

    waveResponse.resolve(wave);
    await expect(data.memesWave).resolves.toEqual(wave);
  });

  it("resolves a failed request to null and keeps the rest", async () => {
    respondWith({
      ...successful(),
      [WAVE_ENDPOINT]: () => Promise.reject(new Error("wave down")),
    });

    const data = startHomeHeroData();

    await expect(data.memesWave).resolves.toBeNull();
    await expect(data.latestMeme).resolves.toEqual(meme);
    await expect(data.settings).resolves.toEqual(settings);
    await expect(data.nextMintDecisions).resolves.toEqual(decisionsPage);
  });

  it("skips the wave requests when settings fail", async () => {
    respondWith({});

    const data = startHomeHeroData();

    await expect(data.latestMeme).resolves.toBeNull();
    await expect(data.settings).resolves.toBeNull();
    await expect(data.memesWave).resolves.toBeNull();
    await expect(data.nextMintDecisions).resolves.toBeNull();
    expect(endpoints()).toEqual(["memes_latest", "settings"]);
  });

  it("bounds every request with one SSR API deadline", async () => {
    jest.useFakeTimers();
    const abortable: Responder = ({ signal }) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason));
      });
    respondWith({
      memes_latest: abortable,
      settings: async () => settings,
      [WAVE_ENDPOINT]: abortable,
      [DECISIONS_ENDPOINT]: abortable,
    });

    const data = startHomeHeroData();
    await jest.advanceTimersByTimeAsync(0);
    const signals = calls().map((call) => call.signal);

    expect(endpoints()).toHaveLength(4);
    expect(new Set(signals).size).toBe(1);
    await jest.advanceTimersByTimeAsync(4499);
    expect(signals[0]?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[0]?.reason).toMatchObject({ name: "TimeoutError" });
    await expect(data.latestMeme).resolves.toBeNull();
    await expect(data.memesWave).resolves.toBeNull();
    await expect(data.nextMintDecisions).resolves.toBeNull();
  });
});
