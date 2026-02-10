import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContentDisplay from "@/components/waves/drops/ContentDisplay";

let segmentProps: any[] = [];
jest.mock(
  "@/components/waves/drops/ContentSegmentComponent",
  () => (props: any) => {
    segmentProps.push(props);
    return (
      <div data-testid={`segment-${props.index}`}>{props.segment.content}</div>
    );
  }
);

jest.mock("@/components/waves/drops/MediaThumbnail", () => (props: any) => (
  <div data-testid={`media-${props.media.url}`} />
));

describe("ContentDisplay", () => {
  beforeEach(() => {
    segmentProps = [];
  });
  const content = {
    segments: [
      { type: "text", content: "hello" },
      { type: "text", content: "world" },
    ],
    apiMedia: [
      { url: "img1", mime_type: "image/png", alt: "", type: "image" },
      { url: "img2", mime_type: "image/png", alt: "", type: "image" },
    ],
  } as any;

  it("calls onClick when container is clicked", async () => {
    const onClick = jest.fn();
    render(<ContentDisplay content={content} onClick={onClick} />);
    await userEvent.click(screen.getByText("hello").closest("span")!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when not provided", async () => {
    render(<ContentDisplay content={content} />);
    await userEvent.click(screen.getByText("world").closest("span")!);
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  it("renders all segments and media", () => {
    render(<ContentDisplay content={content} onClick={jest.fn()} />);
    expect(segmentProps).toHaveLength(2);
    expect(screen.getByTestId("media-img1")).toBeInTheDocument();
    expect(screen.getByTestId("media-img2")).toBeInTheDocument();
  });

  it("renders media when there are no text segments", () => {
    render(
      <ContentDisplay
        content={
          {
            segments: [],
            apiMedia: [{ url: "gif-only", alt: "Media", type: "image" }],
          } as any
        }
      />
    );
    expect(screen.getByTestId("media-gif-only")).toBeInTheDocument();
  });
});
