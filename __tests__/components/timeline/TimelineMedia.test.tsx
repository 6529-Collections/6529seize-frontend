import { render, screen } from "@testing-library/react";
import TimelineMedia, { MediaType } from "@/components/timeline/TimelineMedia";
import { t } from "@/i18n/messages";

jest.mock("@/components/timeline/Timeline.module.css", () => ({
  timelineMediaImage: "media",
}));

describe("TimelineMedia", () => {
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
