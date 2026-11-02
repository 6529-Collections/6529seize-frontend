import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement, forwardRef, type ComponentProps } from "react";
import WaveDropPartContentMediaImage from "@/components/waves/drops/WaveDropPartContentMediaImage";

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockNextImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, alt, ...rest }, ref) =>
      createElement("img", { ...rest, ref, alt: alt ?? "" })
  ),
}));

jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
}));

const GIPHY_GIF =
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/88EhKlGzXuhBfStCds/giphy.gif?cid=790b7611&rid=giphy.gif&ct=g";
const GIPHY_DIRECTORY =
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/88EhKlGzXuhBfStCds/";
const EXTERNAL_GIF = "https://cdn.example.com/reaction.gif";

const proxyUrl = (params: Record<string, string>) =>
  `/api/og-metadata/image?${new URLSearchParams(params).toString()}`;

const originalFetch = globalThis.fetch;
const originalMatchMedia = globalThis.matchMedia;
let paused = true;
const play = jest.fn(async () => {
  paused = false;
});
const pause = jest.fn(() => {
  paused = true;
});

const setReducedMotion = (reduce: boolean) => {
  globalThis.matchMedia = jest.fn((query: string) => ({
    matches: reduce && query === "(prefers-reduced-motion: reduce)",
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof globalThis.matchMedia;
};

const mockProbe = (status: number) => {
  const fetchMock = jest.fn(
    async () =>
      ({
        status,
        body: { cancel: jest.fn().mockResolvedValue(undefined) },
      }) as unknown as Response
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

// The probe settles over several microtasks; let it finish before timers move.
const settleProbe = async () => {
  for (let tick = 0; tick < 5; tick++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const getVideo = () =>
  screen.getByLabelText("Drop media", {
    selector: "video",
  }) as HTMLVideoElement;

beforeEach(() => {
  paused = true;
  play.mockClear();
  pause.mockClear();
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: play,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: pause,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "paused", {
    configurable: true,
    get: () => paused,
  });
  setReducedMotion(false);
  (globalThis as any).ResizeObserver = class {
    observe() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  };
});

afterEach(() => {
  jest.useRealTimers();
  globalThis.fetch = originalFetch;
  globalThis.matchMedia = originalMatchMedia;
});

describe("WaveDropPartContentMediaImage Giphy video", () => {
  it("plays the MP4 rendition through the proxy as a muted, looping inline video", () => {
    render(<WaveDropPartContentMediaImage src={GIPHY_GIF} />);

    const video = getVideo();
    expect(video).toHaveAttribute(
      "src",
      proxyUrl({ url: `${GIPHY_DIRECTORY}giphy.mp4`, format: "mp4" })
    );
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video).toHaveAttribute("playsinline");
    expect(video).not.toHaveAttribute("poster");
    expect(screen.queryByRole("img", { name: "Drop media" })).toBeNull();
    expect(
      screen.getByRole("status", { name: "Loading image" })
    ).toBeInTheDocument();
  });

  it("offers a pause control once the animation plays", () => {
    render(<WaveDropPartContentMediaImage src={GIPHY_GIF} />);
    const video = getVideo();
    expect(
      screen.queryByRole("button", { name: /animation/ })
    ).not.toBeInTheDocument();

    fireEvent.loadedMetadata(video);
    paused = false;
    fireEvent.play(video);
    fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));

    expect(pause).toHaveBeenCalledTimes(1);
    fireEvent.pause(video);
    expect(
      screen.getByRole("button", { name: "Play animation" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Loading image" })
    ).not.toBeInTheDocument();
  });

  it("shows the still without autoplay when reduced motion is preferred", () => {
    setReducedMotion(true);
    render(<WaveDropPartContentMediaImage src={GIPHY_GIF} />);

    const video = getVideo();
    expect(video.autoplay).toBe(false);
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).toHaveAttribute(
      "poster",
      proxyUrl({ url: `${GIPHY_DIRECTORY}480w_s.jpg`, w: "800" })
    );

    fireEvent.loadedMetadata(video);
    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("falls back to the existing GIF preview when the video fails", () => {
    render(<WaveDropPartContentMediaImage src={GIPHY_GIF} />);

    fireEvent.error(getVideo());

    expect(screen.queryByLabelText("Drop media", { selector: "video" })).toBe(
      null
    );
    expect(screen.getByAltText("Drop media")).toHaveAttribute(
      "src",
      proxyUrl({ url: GIPHY_GIF, animated: "1", w: "800" })
    );
  });
});

describe("WaveDropPartContentMediaImage proxy retries", () => {
  it("leaves other external GIFs on the guarded image proxy", () => {
    render(<WaveDropPartContentMediaImage src={EXTERNAL_GIF} />);

    expect(screen.queryByLabelText("Drop media", { selector: "video" })).toBe(
      null
    );
    expect(screen.getByAltText("Drop media")).toHaveAttribute(
      "src",
      proxyUrl({ url: EXTERNAL_GIF, animated: "1", w: "800" })
    );
  });

  it("stops after a definitive proxy failure and keeps manual retry", async () => {
    jest.useFakeTimers();
    const fetchMock = mockProbe(502);
    render(<WaveDropPartContentMediaImage src={EXTERNAL_GIF} />);
    const failedSrc = screen.getByAltText("Drop media").getAttribute("src");

    fireEvent.error(screen.getByAltText("Drop media"));
    expect(screen.getByText("Processing image")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Preview unavailable"
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      failedSrc,
      expect.objectContaining({ cache: "no-store" })
    );
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    // The failed preview stays unmounted: no automatic retry was scheduled.
    expect(screen.queryByAltText("Drop media")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByAltText("Drop media")).toHaveAttribute(
      "src",
      proxyUrl({
        url: EXTERNAL_GIF,
        animated: "1",
        w: "800",
        drop_media_retry: "1",
      })
    );
  });

  it("retries a busy proxy with backoff, keeping the source URL unchanged", async () => {
    jest.useFakeTimers();
    mockProbe(503);
    render(<WaveDropPartContentMediaImage src={EXTERNAL_GIF} />);

    for (const [attempt, delayMs] of [
      [1, 1500],
      [2, 3000],
    ] as const) {
      fireEvent.error(screen.getByAltText("Drop media"));
      await settleProbe();
      expect(globalThis.fetch).toHaveBeenCalledTimes(attempt);
      await act(async () => {
        jest.advanceTimersByTime(delayMs - 1);
      });
      expect(screen.getByText("Processing image")).toBeInTheDocument();
      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.getByAltText("Drop media")).toHaveAttribute(
        "src",
        proxyUrl({
          url: EXTERNAL_GIF,
          animated: "1",
          w: "800",
          drop_media_retry: String(attempt),
        })
      );
    }
  });

  it("shows the error after five busy retries without probing again", async () => {
    jest.useFakeTimers();
    const fetchMock = mockProbe(503);
    render(<WaveDropPartContentMediaImage src={EXTERNAL_GIF} />);

    for (let attempt = 1; attempt <= 5; attempt++) {
      fireEvent.error(screen.getByAltText("Drop media"));
      await settleProbe();
      expect(fetchMock).toHaveBeenCalledTimes(attempt);
      await act(async () => {
        jest.advanceTimersByTime(12_000);
      });
    }
    fireEvent.error(screen.getByAltText("Drop media"));

    expect(screen.getByRole("status")).toHaveTextContent("Preview unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("makes one recovery attempt when the proxy answers 200 but the image failed", async () => {
    jest.useFakeTimers();
    const fetchMock = mockProbe(200);
    render(<WaveDropPartContentMediaImage src={EXTERNAL_GIF} />);

    fireEvent.error(screen.getByAltText("Drop media"));
    await settleProbe();
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByAltText("Drop media")).toHaveAttribute(
      "src",
      proxyUrl({
        url: EXTERNAL_GIF,
        animated: "1",
        w: "800",
        drop_media_retry: "1",
      })
    );

    fireEvent.error(screen.getByAltText("Drop media"));
    await settleProbe();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent("Preview unavailable");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("lets a busy proxy recover into a 200 and still allows one recovery attempt", async () => {
    jest.useFakeTimers();
    const fetchMock = mockProbe(503);
    render(<WaveDropPartContentMediaImage src={EXTERNAL_GIF} />);

    fireEvent.error(screen.getByAltText("Drop media"));
    await settleProbe();
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    mockProbe(200);
    fireEvent.error(screen.getByAltText("Drop media"));
    await settleProbe();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText("Drop media")).toHaveAttribute(
      "src",
      proxyUrl({
        url: EXTERNAL_GIF,
        animated: "1",
        w: "800",
        drop_media_retry: "2",
      })
    );
    fireEvent.load(screen.getByAltText("Drop media"));
    expect(screen.queryByText("Preview unavailable")).not.toBeInTheDocument();
  });
});
