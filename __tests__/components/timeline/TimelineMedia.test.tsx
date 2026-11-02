import { act, fireEvent, render, screen } from "@testing-library/react";
import TimelineMedia, { MediaType } from "@/components/timeline/TimelineMedia";
import { getMediaGatewayFallbackUrls } from "@/components/nft-image/utils/gateway-fallback";
import { publicEnv } from "@/config/env";
import { t } from "@/i18n/messages";
import { parseDecentralizedMediaRef } from "@/lib/media/decentralized-media";

jest.mock("@/components/timeline/Timeline.module.css", () => ({
  timelineMediaImage: "media",
}));

const HISTORICAL_TX = "IFosq_ZN9_PrDSQmq65JTjeB2GnnfPSFoHxRazxC4PY";
const HISTORICAL_URL = `https://arweave.net/${HISTORICAL_TX}/Original.png`;
const RESOLVER_URL = `https://media.6529.io/arweave/${HISTORICAL_TX}/Original.png`;

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("TimelineMedia", () => {
  it("keeps a successful recorded primary source", () => {
    jest.useFakeTimers();
    render(<TimelineMedia url={HISTORICAL_URL} type={MediaType.IMAGE} />);
    const image = screen.getByRole("img");
    fireEvent.load(image);
    act(() => jest.advanceTimersByTime(60000));
    expect(image).toHaveAttribute("src", HISTORICAL_URL);
  });

  it("tries each matching Arweave gateway once and stops when exhausted", () => {
    render(<TimelineMedia url={HISTORICAL_URL} type={MediaType.IMAGE} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", HISTORICAL_URL);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", RESOLVER_URL);
    const attempted = [HISTORICAL_URL];
    for (const candidate of getMediaGatewayFallbackUrls(HISTORICAL_URL)) {
      if (candidate === HISTORICAL_URL) continue;
      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", candidate);
      expect(parseDecentralizedMediaRef(candidate)).toEqual({
        protocol: "arweave",
        id: HISTORICAL_TX,
        path: "Original.png",
      });
      attempted.push(candidate);
      fireEvent.error(image);
    }
    expect(new Set(attempted).size).toBe(attempted.length);
    expect(screen.getByRole("img")).toHaveAttribute("src", attempted.at(-1));
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", attempted.at(-1));
  });

  it("can load a native Arweave reference through the existing resolver", () => {
    render(
      <TimelineMedia
        url={`ar://${HISTORICAL_TX}/Original.png`}
        type={MediaType.IMAGE}
      />
    );
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", RESOLVER_URL);
  });

  it.each([
    "https://archive.example",
    "https://archive.example/media/v1",
    "https://media.6529.io/cache",
  ])("keeps a configured historical resolver at %s", (endpoint) => {
    jest.replaceProperty(publicEnv, "MEDIA_RESOLVER_ENDPOINT", endpoint);
    render(<TimelineMedia url={HISTORICAL_URL} type={MediaType.IMAGE} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", HISTORICAL_URL);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      `${endpoint}/arweave/${HISTORICAL_TX}/Original.png`
    );
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      `https://gateway.arweave.net/${HISTORICAL_TX}/Original.png`
    );
  });

  it("rejects normalized transaction changes on a configured resolver", () => {
    jest.replaceProperty(
      publicEnv,
      "MEDIA_RESOLVER_ENDPOINT",
      "https://archive.example/media/v1"
    );
    const url = `ar://${HISTORICAL_TX}/../ifosq_ZN9_PrDSQmq65JTjeB2GnnfPSFoHxRazxC4PY/old.png`;
    render(<TimelineMedia url={url} type={MediaType.IMAGE} />);
    const image = screen.getByRole("img");
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", url);
  });

  it.each([
    "https://archive.example/old.png",
    "https://arweave.net/invalid/old.png",
    `https://arweave.net.evil.example/${HISTORICAL_TX}/old.png`,
    `ar://${HISTORICAL_TX}/../ifosq_ZN9_PrDSQmq65JTjeB2GnnfPSFoHxRazxC4PY/old.png`,
    "ipfs://bafybeigdyrztu5bq5q6kq6kq6kq6kq6kq6kq6kq6kq6kq6kq/old.png",
  ])("does not invent an Arweave archive for %s", (url) => {
    render(<TimelineMedia url={url} type={MediaType.IMAGE} />);
    const image = screen.getByRole("img");
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", url);
  });

  it("resets fallbacks when another historical version replaces the preview", () => {
    const { rerender } = render(
      <TimelineMedia url={HISTORICAL_URL} type={MediaType.IMAGE} />
    );
    const oldImage = screen.getByRole("img");
    fireEvent.error(oldImage);
    const nextUrl = `https://arweave.net/${HISTORICAL_TX}/original.png`;
    rerender(<TimelineMedia url={nextUrl} type={MediaType.IMAGE} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", nextUrl);
    fireEvent.error(oldImage);
    expect(screen.getByRole("img")).toHaveAttribute("src", nextUrl);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      `https://media.6529.io/arweave/${HISTORICAL_TX}/original.png`
    );
  });

  it("keeps separate historical transactions independent", () => {
    const otherTx = "ifosq_ZN9_PrDSQmq65JTjeB2GnnfPSFoHxRazxC4PY";
    render(
      <>
        <TimelineMedia
          url={HISTORICAL_URL}
          type={MediaType.IMAGE}
          label="Before"
        />
        <TimelineMedia
          url={`https://arweave.net/${otherTx}/Original.png`}
          type={MediaType.IMAGE}
          label="After"
        />
      </>
    );
    const before = screen.getByRole("img", {
      name: t("en-US", "timeline.media.imageAlt", { label: "Before" }),
    });
    fireEvent.error(before);
    expect(
      screen.getByRole("img", {
        name: t("en-US", "timeline.media.imageAlt", { label: "Before" }),
      })
    ).toHaveAttribute("src", RESOLVER_URL);
    expect(
      screen.getByRole("img", {
        name: t("en-US", "timeline.media.imageAlt", { label: "After" }),
      })
    ).toHaveAttribute("src", `https://arweave.net/${otherTx}/Original.png`);
  });

  it("tries every matching video source once and stops when exhausted", () => {
    const load = jest
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => {});
    const { container } = render(
      <TimelineMedia url={HISTORICAL_URL} type={MediaType.VIDEO} />
    );
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("src", HISTORICAL_URL);
    fireEvent.error(video);
    expect(video).toHaveAttribute("src", RESOLVER_URL);
    expect(load).toHaveBeenCalled();
    fireEvent.loadedMetadata(video);
    expect(video).toHaveAttribute("src", RESOLVER_URL);
    const sources = [
      HISTORICAL_URL,
      ...getMediaGatewayFallbackUrls(HISTORICAL_URL).filter(
        (url) => url !== HISTORICAL_URL
      ),
    ];
    for (const source of sources.slice(1)) {
      expect(video).toHaveAttribute("src", source);
      expect(parseDecentralizedMediaRef(source)).toEqual({
        protocol: "arweave",
        id: HISTORICAL_TX,
        path: "Original.png",
      });
      fireEvent.error(video);
    }
    expect(video).toHaveAttribute("src", sources.at(-1));
    expect(load).toHaveBeenCalledTimes(sources.length - 1);
    fireEvent.error(video);
    expect(load).toHaveBeenCalledTimes(sources.length - 1);
    expect(video).toHaveAttribute("src", sources.at(-1));
  });

  it("does not skip a gateway when HTML errors are batched", () => {
    const { container } = render(
      <TimelineMedia url={HISTORICAL_URL} type={MediaType.HTML} />
    );
    const firstFrame = container.querySelector("iframe")!;
    act(() => {
      fireEvent.error(firstFrame);
      fireEvent.error(firstFrame);
    });
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      RESOLVER_URL
    );
    fireEvent.error(container.querySelector("iframe")!);
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      `https://gateway.arweave.net/${HISTORICAL_TX}/Original.png`
    );
  });

  it("advances once when the same HTML source loads then errors in a batch", () => {
    jest.useFakeTimers();
    const { container } = render(
      <TimelineMedia url={HISTORICAL_URL} type={MediaType.HTML} />
    );
    const firstFrame = container.querySelector("iframe")!;
    act(() => {
      fireEvent.load(firstFrame);
      fireEvent.error(firstFrame);
    });
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      RESOLVER_URL
    );
    act(() => jest.advanceTimersByTime(8000));
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      `https://gateway.arweave.net/${HISTORICAL_TX}/Original.png`
    );
  });

  it("ignores a previous HTML frame's events during a timeout advance", () => {
    jest.useFakeTimers();
    const { container } = render(
      <TimelineMedia url={HISTORICAL_URL} type={MediaType.HTML} />
    );
    const firstFrame = container.querySelector("iframe")!;
    act(() => {
      jest.advanceTimersByTime(8000);
      fireEvent.error(firstFrame);
      fireEvent.load(firstFrame);
    });
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      RESOLVER_URL
    );
    act(() => jest.advanceTimersByTime(8000));
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      `https://gateway.arweave.net/${HISTORICAL_TX}/Original.png`
    );
  });

  it("stops the HTML loading timeout after a successful load", () => {
    jest.useFakeTimers();
    const { container } = render(
      <TimelineMedia url={HISTORICAL_URL} type={MediaType.HTML} />
    );
    const frame = container.querySelector("iframe")!;
    fireEvent.load(frame);
    act(() => jest.advanceTimersByTime(60000));
    expect(frame).toHaveAttribute("src", HISTORICAL_URL);
  });

  it("bounds HTML load timeouts and preserves sandbox restrictions", () => {
    jest.useFakeTimers();
    const { container } = render(
      <TimelineMedia url={HISTORICAL_URL} type={MediaType.HTML} />
    );
    act(() => jest.advanceTimersByTime(8000));
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      RESOLVER_URL
    );
    for (
      let i = 0;
      i < getMediaGatewayFallbackUrls(HISTORICAL_URL).length;
      i++
    ) {
      act(() => jest.advanceTimersByTime(8000));
    }
    const frame = container.querySelector("iframe")!;
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame).toHaveAttribute(
      "src",
      `https://ardrive.net/${HISTORICAL_TX}/Original.png`
    );
    fireEvent.error(frame);
    act(() => jest.advanceTimersByTime(60000));
    expect(container.querySelector("iframe")).toBe(frame);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("cleans up the previous HTML version's pending timeout", () => {
    jest.useFakeTimers();
    const { container, rerender, unmount } = render(
      <TimelineMedia url={HISTORICAL_URL} type={MediaType.HTML} />
    );
    act(() => jest.advanceTimersByTime(4000));
    rerender(
      <TimelineMedia
        url="https://archive.example/other.html"
        type={MediaType.HTML}
      />
    );
    act(() => jest.advanceTimersByTime(60000));
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      "https://archive.example/other.html"
    );
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("renders native image with accessible preview text", () => {
    render(
      <TimelineMedia
        url="https://arbitrary.example/media/non-square.png"
        type={MediaType.IMAGE}
        label="Added Image"
      />
    );
    const img = screen.getByRole("img", {
      name: t("en-US", "timeline.media.imageAlt", { label: "Added Image" }),
    });
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute(
      "src",
      "https://arbitrary.example/media/non-square.png"
    );
    expect(img).not.toHaveAttribute("width");
    expect(img).not.toHaveAttribute("height");
    expect(img).toHaveClass("media");
  });

  it("renders video with an accessible label", () => {
    const { container } = render(
      <TimelineMedia
        url="video.mp4"
        type={MediaType.VIDEO}
        label="Added Animation"
      />
    );
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "video.mp4");
    expect(video).toHaveAttribute(
      "aria-label",
      t("en-US", "timeline.media.videoAriaLabel", {
        label: "Added Animation",
      })
    );
  });

  it("renders iframe with a title", () => {
    const { container } = render(
      <TimelineMedia
        url="page.html"
        type={MediaType.HTML}
        label="Added Animation"
      />
    );
    const frame = container.querySelector("iframe");
    expect(frame).toHaveAttribute("src", "page.html");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame).toHaveAttribute(
      "title",
      t("en-US", "timeline.media.htmlTitle", { label: "Added Animation" })
    );
  });
});
