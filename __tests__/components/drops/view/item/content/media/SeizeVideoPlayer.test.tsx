import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";

describe("SeizeVideoPlayer", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => undefined);
    jest
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    jest
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
  });

  it("advances through fallback sources when the direct source errors", () => {
    const { container } = render(
      <SeizeVideoPlayer
        src="https://example.com/primary.mp4"
        fallbackSources={["https://example.com/fallback.mp4"]}
      />
    );

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "https://example.com/primary.mp4");

    if (!video) {
      throw new Error("Expected video element to render");
    }

    fireEvent.error(video);

    expect(video).toHaveAttribute("src", "https://example.com/fallback.mp4");
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
  });

  it("recovers to the first fallback source when the direct source is missing", () => {
    const { container } = render(
      <SeizeVideoPlayer
        fallbackSources={["https://example.com/fallback.mp4"]}
      />
    );

    const video = container.querySelector("video");
    if (!video) {
      throw new Error("Expected video element to render");
    }

    fireEvent.error(video);

    expect(video).toHaveAttribute("src", "https://example.com/fallback.mp4");
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
  });

  it("toggles mute state from the custom control", async () => {
    render(<SeizeVideoPlayer src="https://example.com/video.mp4" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Unmute video" })
    );

    expect(
      screen.getByRole("button", { name: "Mute video" })
    ).toBeInTheDocument();
  });

  it("syncs mute state when the muted prop changes", () => {
    const { rerender } = render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" muted={false} />
    );

    expect(
      screen.getByRole("button", { name: "Mute video" })
    ).toBeInTheDocument();

    rerender(
      <SeizeVideoPlayer src="https://example.com/video.mp4" muted={true} />
    );

    expect(
      screen.getByRole("button", { name: "Unmute video" })
    ).toBeInTheDocument();
  });

  it("does not carry a local mute toggle across source changes", async () => {
    const { rerender } = render(
      <SeizeVideoPlayer src="https://example.com/slide-1.mp4" muted={false} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Mute video" }));
    expect(
      screen.getByRole("button", { name: "Unmute video" })
    ).toBeInTheDocument();

    rerender(
      <SeizeVideoPlayer src="https://example.com/slide-2.mp4" muted={false} />
    );

    expect(
      screen.getByRole("button", { name: "Mute video" })
    ).toBeInTheDocument();
  });

  it("falls back to native iOS video fullscreen when wrapper fullscreen is unavailable", async () => {
    const webkitEnterFullscreen = jest.fn();
    Object.defineProperty(HTMLVideoElement.prototype, "webkitEnterFullscreen", {
      configurable: true,
      value: webkitEnterFullscreen,
    });
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: false,
    });

    render(<SeizeVideoPlayer src="https://example.com/video.mp4" />);

    await userEvent.click(screen.getByRole("button", { name: "Full screen" }));

    await waitFor(() => {
      expect(webkitEnterFullscreen).toHaveBeenCalled();
    });
  });

  it("toggles playback when the video surface is clicked", async () => {
    render(
      <SeizeVideoPlayer src="https://example.com/video.mp4" autoPlay={false} />
    );

    await userEvent.click(screen.getByRole("group", { name: "Video player" }));

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });
});
