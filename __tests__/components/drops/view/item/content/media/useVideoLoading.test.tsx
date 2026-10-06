import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useVideoLoading } from "@/components/drops/view/item/content/media/useVideoLoading";

function Video({
  isNative,
  isInView = false,
}: {
  readonly isNative: boolean;
  readonly isInView?: boolean;
}) {
  const { renderedSrc, videoPreload } = useVideoLoading({
    directSrc: "clip.mp4",
    videoElement: null,
    isNative,
    isInView,
    isAppActive: true,
    isAnyFullscreen: false,
    openedSource: undefined,
    poster: undefined,
    isPosterGateClosed: false,
    autoPlay: false,
    preload: "metadata",
  });
  return <video src={renderedSrc} preload={videoPreload} />;
}

it.each([false, true])(
  "hydrates without attaching an offscreen native source (native=%s)",
  async (isNative) => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Video isNative={false} />);
    const video = container.querySelector("video")!;
    expect(video).not.toHaveAttribute("src");
    expect(video.preload).toBe("none");
    const onRecoverableError = jest.fn();
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Video isNative={isNative} />, {
          onRecoverableError,
        });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      if (isNative) {
        expect(video).not.toHaveAttribute("src");
        expect(video.preload).toBe("none");
      } else {
        expect(video).toHaveAttribute("src", "clip.mp4");
        expect(video.preload).toBe("metadata");
      }
      await act(async () =>
        root?.render(<Video isNative={isNative} isInView />)
      );
      expect(video).toHaveAttribute("src", "clip.mp4");
    } finally {
      act(() => root?.unmount());
      consoleError.mockRestore();
    }
  }
);
