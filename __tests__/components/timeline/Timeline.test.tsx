import { render, screen } from "@testing-library/react";
import Timeline from "@/components/timeline/Timeline";
import { MediaType } from "@/components/timeline/TimelineMedia";

jest.mock("@/components/timeline/Timeline.module.scss", () => ({
  timeline: "timeline",
  timelineContainer: "container",
  content: "content",
  linkIcon: "linkIcon",
  changesUl: "changesUl",
}));

let mediaProps: any[] = [];
jest.mock("@/components/timeline/TimelineMedia", () => ({
  __esModule: true,
  MediaType: { IMAGE: 0, VIDEO: 1, HTML: 2 },
  default: (props: any) => {
    mediaProps.push(props);
    return (
      <div data-testid="media" data-type={props.type} data-url={props.url} />
    );
  },
}));

const baseNft = {
  metadata: { animation_details: { format: "MP4" } },
} as any;

const makeStep = (changeKey: string, from: any, to: any) =>
  ({
    block: 1,
    transaction_date: "2024-05-02T07:08:00Z",
    transaction_hash: "0xabc",
    uri: "https://example.com",
    description: {
      event: "Minted",
      changes: [{ key: changeKey, from, to }],
    },
  } as any);

beforeEach(() => {
  mediaProps = [];
});

describe("Timeline", () => {
  it("formats date header and displays key label", () => {
    render(<Timeline nft={baseNft} steps={[makeStep("some_key", "a", "b")]} />);
    expect(screen.getByText("2024/05/02 - 07:08 UTC")).toBeInTheDocument();
    expect(screen.getByText("Some Key")).toBeInTheDocument();
  });

  it("passes image type for image changes", () => {
    render(
      <Timeline
        nft={baseNft}
        steps={[makeStep("image", undefined, "img.png")]}
      />
    );
    expect(mediaProps[0]).toMatchObject({
      type: MediaType.IMAGE,
      url: "img.png",
    });
  });

  it("uses video type when nft animation is video", () => {
    render(
      <Timeline
        nft={baseNft}
        steps={[makeStep("animation", undefined, "vid.mp4")]}
      />
    );
    expect(mediaProps[0]).toMatchObject({
      type: MediaType.VIDEO,
      url: "vid.mp4",
    });
  });

  it("links to url when key is animation_url", () => {
    render(
      <Timeline
        nft={baseNft}
        steps={[makeStep("animation_url", undefined, "https://foo.com")]}
      />
    );
    const link = screen.getByText("https://foo.com");
    expect(link.closest("a")).toHaveAttribute("href", "https://foo.com");
  });
});
