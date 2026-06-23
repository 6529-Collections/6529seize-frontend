import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropPartContent from "@/components/waves/drops/WaveDropPartContent";
import {
  buildQuorumProposalMarkdown,
  EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
} from "@/components/waves/quorum/quorumProposalMarkdown";

let mockGalleryItems: any[] | undefined;
let mockMarkdownProps: any;

jest.mock(
  "@/components/drops/view/part/DropImageGalleryProvider",
  () => ({
    DropImageGalleryProvider: (props: any) => {
      mockGalleryItems = props.items;
      return <div data-testid="gallery-provider">{props.children}</div>;
    },
  })
);
jest.mock(
  "@/components/waves/drops/WaveDropPartContentMarkdown",
  () => (props: any) => {
    mockMarkdownProps = props;
    return <div data-testid="markdown">{props.part.content}</div>;
  }
);
jest.mock(
  "@/components/waves/drops/WaveDropPartContentMedias",
  () => (props: any) => (
    <div data-testid="medias">{props.activePart.media.length}</div>
  )
);

const baseProps = {
  mentionedUsers: [],
  referencedNfts: [],
  wave: {} as any,
  activePart: { content: "test", media: [] } as any,
  havePreviousPart: false,
  haveNextPart: false,
  isStorm: false,
  activePartIndex: 0,
  setActivePartIndex: jest.fn(),
  onQuoteClick: jest.fn(),
};

beforeEach(() => {
  mockGalleryItems = undefined;
  mockMarkdownProps = undefined;
});

it("renders markdown without medias", () => {
  render(<WaveDropPartContent {...baseProps} />);
  expect(screen.getByTestId("markdown")).toHaveTextContent("test");
  expect(screen.queryByTestId("medias")).toBeNull();
});

it("renders medias and navigation", async () => {
  const user = userEvent.setup();
  const props = {
    ...baseProps,
    isStorm: true,
    haveNextPart: true,
    activePart: { content: "c", media: [{ url: "u", mime_type: "m" }] } as any,
  };
  render(<WaveDropPartContent {...props} />);
  expect(screen.getByTestId("medias")).toBeInTheDocument();
  await user.click(screen.getAllByLabelText("Next part")[0]);
  expect(props.setActivePartIndex).toHaveBeenCalledWith(
    props.activePartIndex + 1
  );
});

it("builds default gallery items from full body markdown and media", () => {
  render(
    <WaveDropPartContent
      {...baseProps}
      activePart={
        {
          content: "![body](https://cdn.example.com/body.jpg)",
          media: [{ url: "media.jpg", mime_type: "image/jpeg" }],
        } as any
      }
    />
  );

  expect(mockGalleryItems?.map((item) => item.id)).toEqual([
    "drop-image-gallery:body:0:https://cdn.example.com/body.jpg",
    "drop-image-gallery:media:0:media.jpg",
  ]);
});

it("omits body gallery items while the body is in edit mode", () => {
  render(
    <WaveDropPartContent
      {...baseProps}
      isEditing
      activePart={
        {
          content: "![body](https://cdn.example.com/body.jpg)",
          media: [{ url: "media.jpg", mime_type: "image/jpeg" }],
        } as any
      }
    />
  );

  expect(mockGalleryItems?.map((item) => item.id)).toEqual([
    "drop-image-gallery:media:0:media.jpg",
  ]);
});

it("uses only visible compact quorum markdown blocks for body gallery items", () => {
  const compactContent = buildQuorumProposalMarkdown({
    ...EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
    title: "Slow Mode",
    summary: "![summary](https://cdn.example.com/summary.jpg)",
    problemStatement: "![section](https://cdn.example.com/section.jpg)",
  });

  render(
    <WaveDropPartContent
      {...baseProps}
      contentPresentation="quorumCompact"
      activePart={{ content: compactContent, media: [] } as any}
    />
  );

  expect(mockGalleryItems?.map((item) => item.id)).toEqual([
    "drop-image-gallery:body:quorum-compact:summary:0:https://cdn.example.com/summary.jpg",
  ]);

  act(() => {
    mockMarkdownProps.onQuorumCompactDetailsVisibleChange(true);
    mockMarkdownProps.onQuorumCompactSectionOpenChange(
      "section:0:Problem Statement",
      true
    );
  });

  expect(mockGalleryItems?.map((item) => item.id)).toEqual([
    "drop-image-gallery:body:quorum-compact:summary:0:https://cdn.example.com/summary.jpg",
    "drop-image-gallery:body:quorum-compact:section:0:Problem Statement:0:https://cdn.example.com/section.jpg",
  ]);
});
