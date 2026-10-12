import { act, render, screen } from "@testing-library/react";
import { checkVideoAvailability } from "@/helpers/video.helpers";
import { ChatVideoPlaybackProvider } from "@/components/drops/view/item/content/media/ChatVideoPlayback";
import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";
import MediaDisplayVideo from "@/components/drops/view/item/content/media/MediaDisplayVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { getResponsiveVideoStyle } from "@/components/drops/view/item/content/media/SeizeVideoPlayer.config";

jest.mock("@/helpers/video.helpers", () => ({
  ...jest.requireActual("@/helpers/video.helpers"),
  checkVideoAvailability: jest.fn(
    async (url: string) => !url.endsWith("_device.jpg")
  ),
}));
jest.mock("@/hooks/useMobileAppActivity", () => ({
  useMobileAppActivity: () => true,
  useMobileBatterySavings: () => false,
}));
jest.mock("@/hooks/useDeviceInfo", () => () => ({ isApp: false }));
jest.mock("@/hooks/useInView", () => ({ useInView: () => [jest.fn(), true] }));
jest.mock("@/hooks/useOptimizedVideo", () => ({
  useOptimizedVideo: (src: string) => ({ playableUrl: src, isHls: false }),
}));
jest.mock("@/hooks/useHlsPlayer", () => ({
  useHlsPlayer: jest.fn(() => ({
    videoRef: { current: null },
    retry: jest.fn(),
    isFullscreen: false,
  })),
}));
const src = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/clip.mp4";
let image: HTMLImageElement;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(globalThis, "Image").mockImplementation(() => {
    image = document.createElement("img");
    Object.defineProperties(image, {
      naturalWidth: { value: 360 },
      naturalHeight: { value: 640 },
    });
    return image;
  });
  jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it("uses portrait preview dimensions before chat metadata without changing NFT prominent layouts", () => {
  const options = {
    isFullscreen: false,
    videoSize: undefined,
    directSrc: undefined,
    aspectRatioHint: 360 / 640,
    aspectRatio: undefined,
    viewportHeight: 900,
  };
  expect(getResponsiveVideoStyle({ ...options, layout: "natural" })).toEqual({
    aspectRatio: "0.5625",
    maxHeight: "520px",
    maxWidth: "292px",
  });
  expect(getResponsiveVideoStyle({ ...options, layout: "prominent" })).toEqual({
    aspectRatio: "16 / 9",
    maxHeight: "650px",
  });
});

it.each([DropListItemContentMediaVideo, MediaDisplayVideo])(
  "shows a chat poster without starting playback (%p)",
  async (Video) => {
    render(
      <ChatVideoPlaybackProvider>
        <Video src={src} />
      </ChatVideoPlaybackProvider>
    );
    await act(async () => {});
    act(() => image.dispatchEvent(new Event("load")));
    const video = screen.getByLabelText("Video player");
    expect(video).toHaveAttribute(
      "poster",
      src.replace(
        "/drops/author/clip.mp4",
        "/renditions/drops/author/clip/poster/clip_poster.0000001.jpg"
      )
    );
    expect(video).not.toHaveAttribute("src");
    expect(video).toHaveAttribute("preload", "none");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(useHlsPlayer).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false, autoPlay: false })
    );
  }
);

it.each([DropListItemContentMediaVideo, MediaDisplayVideo])(
  "does not request a poster outside chat (%p)",
  async (Video) => {
    render(<Video src={src} />);
    await act(async () => {});
    expect(checkVideoAvailability).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Video player")).not.toHaveAttribute("poster");
  }
);
