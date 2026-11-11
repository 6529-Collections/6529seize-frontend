import { render } from "@testing-library/react";
import DropListItemContentMediaAudio from "@/components/drops/view/item/content/media/DropListItemContentMediaAudio";
import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";
import MediaDisplayAudio from "@/components/drops/view/item/content/media/MediaDisplayAudio";
import MediaDisplayVideo from "@/components/drops/view/item/content/media/MediaDisplayVideo";
import { getMediaPlaybackUrl } from "@/components/drops/view/item/content/media/mediaPlaybackUrl";

const PREVIOUS_ENDPOINT = "https://media.6529.io";
const CONTENT_DOMAIN_ENDPOINT = "https://media.6529usercontent.com";

type EndpointHolder = { mediaResolverEndpointForPlaybackTest?: string };

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    publicEnv: new Proxy(actual.publicEnv, {
      get: (target, key) =>
        key === "MEDIA_RESOLVER_ENDPOINT"
          ? ((globalThis as EndpointHolder)
              .mediaResolverEndpointForPlaybackTest ??
            Reflect.get(target, key))
          : Reflect.get(target, key),
    }),
  };
});

jest.mock("@/hooks/useInView", () => ({
  useInView: jest.fn(() => [jest.fn(), true]),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useDeviceInfo", () => () => ({ isApp: false }));
jest.mock("@/hooks/useOptimizedVideo", () => ({
  useOptimizedVideo: jest.fn((url: string) => ({
    playableUrl: url,
    isHls: false,
  })),
}));
jest.mock("@/hooks/useHlsPlayer", () => ({
  useHlsPlayer: jest.fn(() => ({
    videoRef: { current: null },
    retry: jest.fn(),
    isFullscreen: false,
  })),
}));

const mockUseOptimizedVideo = require("@/hooks/useOptimizedVideo")
  .useOptimizedVideo as jest.Mock;
const mockUseHlsPlayer = require("@/hooks/useHlsPlayer")
  .useHlsPlayer as jest.Mock;

const CID = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";
const STORED_VIDEO = `https://media.6529.io/ipfs/${CID}/clip.mp4`;
const STORED_LEGACY_VIDEO = `https://ipfs.6529.io/ipfs/${CID}/clip.mp4`;
const CONTENT_DOMAIN_VIDEO = `https://media.6529usercontent.com/ipfs/${CID}/clip.mp4`;
const STORED_AUDIO = `https://media.6529.io/ipfs/${CID}/song.mp3`;
const CONTENT_DOMAIN_AUDIO = `https://media.6529usercontent.com/ipfs/${CID}/song.mp3`;
const UPLOAD_VIDEO =
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_1/clip.mp4";

function setEndpoint(endpoint: string) {
  (globalThis as EndpointHolder).mediaResolverEndpointForPlaybackTest =
    endpoint;
}

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: jest.fn(),
  });
});

beforeEach(() => {
  mockUseOptimizedVideo.mockClear();
  mockUseHlsPlayer.mockClear();
});

afterAll(() => {
  delete (globalThis as EndpointHolder).mediaResolverEndpointForPlaybackTest;
});

const videoRenderers = [
  [
    "DropListItemContentMediaVideo",
    (src: string) => render(<DropListItemContentMediaVideo src={src} />),
  ],
  [
    "MediaDisplayVideo",
    (src: string) => render(<MediaDisplayVideo src={src} />),
  ],
] as const;

const audioRenderers = [
  [
    "DropListItemContentMediaAudio",
    (src: string) => render(<DropListItemContentMediaAudio src={src} />),
  ],
  [
    "MediaDisplayAudio",
    (src: string) => render(<MediaDisplayAudio src={src} showControls />),
  ],
] as const;

function expectVideoPlayback(playbackUrl: string) {
  expect(mockUseOptimizedVideo).toHaveBeenCalledWith(
    playbackUrl,
    expect.any(Object)
  );
  expect(mockUseHlsPlayer).toHaveBeenLastCalledWith(
    expect.objectContaining({ src: playbackUrl, fallbackSrc: playbackUrl })
  );
}

describe("with the previous media endpoint", () => {
  beforeEach(() => setEndpoint(PREVIOUS_ENDPOINT));

  it("keeps every stored URL as it is", () => {
    for (const input of [STORED_VIDEO, STORED_LEGACY_VIDEO, UPLOAD_VIDEO]) {
      expect(getMediaPlaybackUrl(input)).toBe(input);
    }
  });

  it.each(videoRenderers)("%s plays the stored URL", (_name, renderVideo) => {
    const { container } = renderVideo(STORED_VIDEO);
    expectVideoPlayback(STORED_VIDEO);
    expect(container.querySelector("[data-url]")).toHaveAttribute(
      "data-url",
      STORED_VIDEO
    );
  });

  it.each(audioRenderers)("%s plays the stored URL", (_name, renderAudio) => {
    const { container } = renderAudio(STORED_AUDIO);
    expect(container.querySelector("source")).toHaveAttribute(
      "src",
      STORED_AUDIO
    );
  });
});

describe("with the content-domain media endpoint", () => {
  beforeEach(() => setEndpoint(CONTENT_DOMAIN_ENDPOINT));

  it.each(videoRenderers)(
    "%s plays stored first-party gateway URLs from the configured endpoint",
    (_name, renderVideo) => {
      const { container, unmount } = renderVideo(STORED_VIDEO);
      expectVideoPlayback(CONTENT_DOMAIN_VIDEO);
      expect(container.querySelector("[data-url]")).toHaveAttribute(
        "data-url",
        CONTENT_DOMAIN_VIDEO
      );
      unmount();

      renderVideo(STORED_LEGACY_VIDEO);
      expectVideoPlayback(CONTENT_DOMAIN_VIDEO);
    }
  );

  it.each(videoRenderers)(
    "%s keeps upload URLs for rendition selection",
    (_name, renderVideo) => {
      renderVideo(UPLOAD_VIDEO);
      expectVideoPlayback(UPLOAD_VIDEO);
    }
  );

  it.each(audioRenderers)(
    "%s plays stored first-party gateway URLs from the configured endpoint",
    (_name, renderAudio) => {
      const { container } = renderAudio(STORED_AUDIO);
      expect(container.querySelector("source")).toHaveAttribute(
        "src",
        CONTENT_DOMAIN_AUDIO
      );
    }
  );

  it("leaves other hosts unchanged", () => {
    const other = `https://ipfs.io/ipfs/${CID}/song.mp3`;
    const { container } = render(<DropListItemContentMediaAudio src={other} />);
    expect(container.querySelector("source")).toHaveAttribute("src", other);
  });
});
