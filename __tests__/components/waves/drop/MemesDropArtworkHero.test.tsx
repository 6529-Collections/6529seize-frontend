import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { MemesDropArtworkHero } from "@/components/waves/drop/MemesDropArtworkHero";

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => ({
    __esModule: true,
    default: jest.fn(
      (_props: ComponentProps<typeof DropListItemContentMedia>) => (
        <div data-testid="media" />
      )
    ),
  })
);

it.each(["video/mp4", "video/webm"])(
  "centers %s in the available stage without stretching the video",
  (mimeType) => {
    render(
      <MemesDropArtworkHero
        artworkMedia={{ mime_type: mimeType, url: "video" }}
      />
    );
    expect(
      jest.mocked(DropListItemContentMedia).mock.calls.at(-1)?.[0]
    ).toMatchObject({
      artworkVideoLayout: true,
      fillVideoContainer: false,
      videoAlign: "center",
      loadStrategy: "eager",
    });
    const frame = screen.getByTestId("media").parentElement!;
    const hero = frame.closest("[data-video-artwork]")!;
    expect(frame.className).not.toMatch(/tw-h-\[/);
    expect(hero).not.toHaveClass("lg:tw-min-h-screen");
    expect(hero).toHaveClass("artworkStage");
    const padding = frame.parentElement!.parentElement!;
    expect(padding).toHaveClass(
      "[--video-frame-padding:2rem]",
      "lg:[--video-frame-padding:4rem]"
    );
    expect(padding).toHaveClass(
      "tw-flex-1",
      "tw-items-center",
      "tw-justify-center"
    );
  }
);

it.each(["text/html"])("preserves the explicit frame for %s", (mimeType) => {
  render(
    <MemesDropArtworkHero
      artworkMedia={{ mime_type: mimeType, url: "artwork" }}
    />
  );
  expect(
    jest.mocked(DropListItemContentMedia).mock.calls.at(-1)?.[0]
  ).toMatchObject({
    artworkVideoLayout: false,
    fillVideoContainer: true,
    loadStrategy: mimeType === "text/html" ? "in-view" : "eager",
  });
  expect(screen.getByTestId("media").parentElement).toHaveClass(
    "lg:tw-h-[95vh]"
  );
});

it("keeps an empty submission free of a video frame", () => {
  const { container } = render(<MemesDropArtworkHero />);
  expect(screen.queryByTestId("media")).not.toBeInTheDocument();
  expect(container.querySelector("[data-video-artwork]")).toBeNull();
});

it("fits a submission image below the header with the shared screen budget", () => {
  render(
    <MemesDropArtworkHero
      artworkMedia={{ mime_type: "image/png", url: "portrait.png" }}
    />
  );
  const frame = screen.getByTestId("media").parentElement!;
  expect(frame).toHaveClass("submissionImage");
  expect(frame).not.toHaveClass("lg:tw-h-[95vh]");
  expect(frame.closest("[data-image-artwork]")).toHaveClass("artworkStage");
  expect(frame.parentElement?.parentElement).toHaveClass(
    "[--video-frame-padding:2rem]",
    "lg:[--video-frame-padding:4rem]"
  );
});
