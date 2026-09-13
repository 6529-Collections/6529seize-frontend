import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";

interface PriceResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly json: () => Promise<unknown>;
}

type PriceFetch = jest.Mock<
  Promise<PriceResponse>,
  [string, { readonly signal: AbortSignal }]
>;

interface ArtworkPrice {
  readonly fetchEthPrice: () => Promise<boolean>;
  readonly fetchAndApplyColors: () => Promise<void>;
  readonly refreshPrice: () => Promise<void>;
  readonly getState: () => {
    readonly change: number;
    readonly palette: readonly string[];
  };
}

const html = readFileSync(
  join(process.cwd(), "public/artwork/the-memes/445.html"),
  "utf8"
).replaceAll("\r\n", "\n");
const moduleBody = html
  .split('<script type="module">')[1]
  ?.split("</script>")[0];
if (!moduleBody) throw new Error("The artwork's module script is missing");

// Exercise the shipped script without its external module or automatic WebGL setup.
const script = moduleBody
  .replace(
    "import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';",
    ""
  )
  .replace(/^\s*init\(\);\s*$/m, "");

function createArtwork() {
  const status = { textContent: "", className: "", title: "" };
  const regenerateButton = { disabled: false, textContent: "Ready" };
  const fetch: PriceFetch = jest.fn();
  const context = createContext({
    AbortController,
    clearTimeout,
    fetch,
    setTimeout,
    status,
    button: regenerateButton,
    window: { innerWidth: 1024 },
  });
  runInContext(script, context);
  const artwork: ArtworkPrice = runInContext(
    `
      ethStatusEl = status;
      regenerateButton = button;
      currentEthChange = -2;
      sceneReady = true;
      updateBackgroundPalette(false);
      ({
        fetchEthPrice,
        fetchAndApplyColors,
        refreshPrice,
        getState: () => ({ change: currentEthChange, palette: [...bgPalette] })
      });
    `,
    context
  );
  return { artwork, context, fetch, regenerateButton, status };
}

function priceResponse(data: unknown): PriceResponse {
  return { ok: true, status: 200, json: async () => data };
}

describe("Meebits #445 ETH price updates", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each([
    {
      last: "2200",
      change: 10,
      text: "ETH: $2,200.00 | 24h: +10.00% (UP)",
      className: "price-up",
      color: "#1b5e20",
    },
    {
      last: "1800",
      change: -10,
      text: "ETH: $1,800.00 | 24h: -10.00% (DOWN)",
      className: "price-down",
      color: "#b71c1c",
    },
    {
      last: "2000",
      change: 0,
      text: "ETH: $2,000.00 | 24h: +0.00% (UP)",
      className: "price-up",
      color: "#1b5e20",
    },
  ])("updates the displayed price and colors for $change%", async (sample) => {
    const { artwork, fetch, status } = createArtwork();
    fetch.mockResolvedValue(priceResponse({ last: sample.last, open: "2000" }));

    await expect(artwork.fetchEthPrice()).resolves.toBe(true);

    expect(artwork.getState().change).toBe(sample.change);
    expect(artwork.getState().palette).toContain(sample.color);
    expect(status.textContent).toBe(sample.text);
    expect(status.className).toBe(sample.className);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.exchange.coinbase.com/products/ETH-USD/stats",
      expect.objectContaining({ credentials: "omit", cache: "no-store" })
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([
    null,
    {},
    { last: null, open: "2000" },
    { last: "2000", open: null },
    { last: 2000, open: "2000" },
    { last: "2000", open: 2000 },
    { last: "0", open: "2000" },
    { last: "-1", open: "2000" },
    { last: "2000", open: "0" },
    { last: "2000", open: "-1" },
    { last: "", open: "2000" },
    { last: "2000bad", open: "2000" },
    { last: "NaN", open: "2000" },
    { last: "2000", open: "Infinity" },
    { last: "Infinity", open: "2000" },
    { last: "1e308", open: "1e-308" },
  ])(
    "rejects malformed prices without changing the artwork: %j",
    async (data) => {
      const { artwork, fetch, regenerateButton, status } = createArtwork();
      const previousState = artwork.getState();
      fetch.mockResolvedValue(priceResponse(data));

      await artwork.fetchAndApplyColors();

      expect(artwork.getState()).toEqual(previousState);
      expect(regenerateButton).toEqual({
        disabled: false,
        textContent: "Ready",
      });
      expect(status.textContent).toBe(
        "ETH price unavailable. Retrying shortly."
      );
      expect(status.className).toBe("");
      expect(jest.getTimerCount()).toBe(0);
    }
  );

  it("preserves the last successful colors when the next request fails", async () => {
    const { artwork, fetch, status } = createArtwork();
    fetch.mockResolvedValueOnce(priceResponse({ last: "2200", open: "2000" }));
    await artwork.fetchEthPrice();
    const previousState = artwork.getState();
    fetch.mockRejectedValueOnce(new Error("Network unavailable"));

    await expect(artwork.fetchEthPrice()).resolves.toBe(false);

    expect(artwork.getState()).toEqual(previousState);
    expect(status.textContent).toBe("ETH price unavailable. Retrying shortly.");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects unsuccessful HTTP responses before reading their payload", async () => {
    const { artwork, fetch } = createArtwork();
    const json = jest.fn(async () => ({ last: "2200", open: "2000" }));
    fetch.mockResolvedValue({ ok: false, status: 503, json });

    await expect(artwork.fetchEthPrice()).resolves.toBe(false);

    expect(json).not.toHaveBeenCalled();
    expect(artwork.getState().change).toBe(-2);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("handles malformed JSON without leaving a request timer running", async () => {
    const { artwork, fetch } = createArtwork();
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Invalid JSON");
      },
    });

    await expect(artwork.fetchEthPrice()).resolves.toBe(false);

    expect(artwork.getState().change).toBe(-2);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("aborts a hanging request after eight seconds and retries a minute later", async () => {
    const { artwork, fetch, status } = createArtwork();
    const signals: AbortSignal[] = [];
    fetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signals.push(signal);
          signal.addEventListener("abort", () => reject(new Error("Aborted")));
        })
    );
    const refresh = artwork.refreshPrice();

    await jest.advanceTimersByTimeAsync(7999);
    expect(signals[0]?.aborted).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    await refresh;
    expect(signals[0]?.aborted).toBe(true);
    expect(status.textContent).toBe("ETH price unavailable. Retrying shortly.");

    await jest.advanceTimersByTimeAsync(59999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(signals[1]?.aborted).toBe(false);

    await jest.advanceTimersByTimeAsync(8000);
    expect(signals[1]?.aborted).toBe(true);
  });

  it("waits for successful color application before scheduling the next refresh", async () => {
    const { artwork, fetch, regenerateButton } = createArtwork();
    fetch.mockResolvedValue(priceResponse({ last: "2200", open: "2000" }));
    const refresh = artwork.refreshPrice();

    await jest.advanceTimersByTimeAsync(10);
    await refresh;
    expect(regenerateButton.textContent).toBe("Regenerate Camo");
    expect(fetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(59999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(10);
    expect(jest.getTimerCount()).toBe(1);
  });

  it("keeps the shared motion clock and rotation still while paused", () => {
    const { context } = createArtwork();
    const snapshot = runInContext(
      `
        animationTime = 1000;
        lastFrameTime = 1000;
        Date.now = () => 2000;
        mainCube = { rotation: { x: 0, y: 0 } };
        renderer = { render() {} };
        requestAnimationFrame = () => 1;
        isPaused = true;
        animate();
        ({ time: animationTime, rotation: { ...mainCube.rotation } });
      `,
      context
    );
    expect(snapshot).toEqual({ time: 1000, rotation: { x: 0, y: 0 } });

    const resumed = runInContext(
      `
        isPaused = false;
        Date.now = () => 2100;
        animate();
        ({ time: animationTime, rotation: { ...mainCube.rotation } });
      `,
      context
    );
    expect(resumed).toEqual({ time: 1100, rotation: { x: 0.002, y: 0.002 } });
  });

  it("shows a scene failure and still starts the independent price tracker", async () => {
    const { context, fetch } = createArtwork();
    const artworkDocument = document.implementation.createHTMLDocument();
    artworkDocument.body.innerHTML = `
      <output id="ethStatus"></output>
      <output id="artworkStatus" hidden></output>
      <button id="pauseButton"></button>
      <button id="regenerateButton"></button>
    `;
    const motionListener = jest.fn<
      void,
      ["change", (event: { readonly matches: boolean }) => void]
    >();
    const motionPreference = {
      matches: true,
      addEventListener: motionListener,
    };
    Object.assign(context, {
      document: artworkDocument,
      window: { innerWidth: 1024, matchMedia: () => motionPreference },
    });
    fetch.mockResolvedValue(priceResponse({ last: "2200", open: "2000" }));

    // No THREE implementation is supplied: scene setup fails before any WebGL work.
    await runInContext("init()", context);
    await jest.advanceTimersByTimeAsync(0);

    expect(artworkDocument.getElementById("artworkStatus")?.hidden).toBe(false);
    expect(artworkDocument.querySelector("button")?.disabled).toBe(true);
    expect(artworkDocument.getElementById("ethStatus")?.textContent).toContain(
      "ETH: $2,200.00"
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(runInContext("isPaused", context)).toBe(true);
    expect(motionPreference.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );

    const onMotionChange = motionListener.mock.calls[0]?.[1];
    expect(onMotionChange).toBeDefined();
    // Turning the OS preference off must not resume a user's paused artwork.
    runInContext("sceneReady = true; isPaused = true", context);
    onMotionChange?.({ matches: false });
    expect(runInContext("isPaused", context)).toBe(true);
    runInContext("isPaused = false", context);
    onMotionChange?.({ matches: true });
    expect(runInContext("isPaused", context)).toBe(true);
    expect(
      artworkDocument.getElementById("pauseButton")?.getAttribute("aria-label")
    ).toBe("Resume animation");
  });
});
