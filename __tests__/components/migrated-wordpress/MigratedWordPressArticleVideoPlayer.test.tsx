import { render, screen, waitFor } from "@testing-library/react";

import MigratedWordPressArticleVideoPlayer from "@/components/migrated-wordpress/MigratedWordPressArticleVideoPlayer";

const video = {
  src: "https://example.com/animation.mp4",
  title: "Demo animation",
};

function mockPrefersReducedMotion(matches: boolean) {
  jest.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }) as unknown as MediaQueryList
  );
}

describe("MigratedWordPressArticleVideoPlayer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts looping playback after mount when motion is allowed", async () => {
    mockPrefersReducedMotion(false);
    const playSpy = jest
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue();

    render(<MigratedWordPressArticleVideoPlayer video={video} />);

    await waitFor(() => expect(playSpy).toHaveBeenCalledTimes(1));
    const element = screen.getByLabelText<HTMLVideoElement>("Demo animation");
    expect(element.loop).toBe(true);
    // Server markup must not autoplay; playback starts only client-side.
    expect(element).not.toHaveAttribute("autoplay");
  });

  it("stays paused and does not loop under prefers-reduced-motion (SC 2.2.2)", async () => {
    mockPrefersReducedMotion(true);
    const playSpy = jest
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue();

    render(<MigratedWordPressArticleVideoPlayer video={video} />);

    const element = screen.getByLabelText<HTMLVideoElement>("Demo animation");
    await waitFor(() => expect(element).toBeInTheDocument());
    expect(playSpy).not.toHaveBeenCalled();
    expect(element.loop).toBe(false);
    // Users can still start it manually.
    expect(element).toHaveAttribute("controls");
  });
});
