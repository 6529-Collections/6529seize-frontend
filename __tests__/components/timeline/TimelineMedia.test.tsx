import { render, screen } from "@testing-library/react";
import TimelineMedia, { MediaType } from "@/components/timeline/TimelineMedia";
import { t } from "@/i18n/messages";
import { createElement } from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => createElement("img", props),
}));

jest.mock("@/components/timeline/Timeline.module.scss", () => ({
  timelineMediaImage: "media",
}));

describe("TimelineMedia", () => {
  it("renders image element with accessible preview text", () => {
    render(
      <TimelineMedia url="img.png" type={MediaType.IMAGE} label="Added Image" />
    );
    const img = screen.getByRole("img", {
      name: t("en-US", "timeline.media.imageAlt", { label: "Added Image" }),
    });
    expect(img).toHaveAttribute("src", "img.png");
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
    expect(frame).toHaveAttribute(
      "title",
      t("en-US", "timeline.media.htmlTitle", { label: "Added Animation" })
    );
  });
});
