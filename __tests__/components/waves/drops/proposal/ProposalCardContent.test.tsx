import { render, screen } from "@testing-library/react";
import ProposalCardContent from "@/components/waves/drops/proposal/ProposalCardContent";
import { ApiAttachmentKind } from "@/generated/models/ApiAttachmentKind";
import { ApiAttachmentStatus } from "@/generated/models/ApiAttachmentStatus";
import { ApiAttachmentUploadMimeType } from "@/generated/models/ApiAttachmentUploadMimeType";
import type { ComponentProps } from "react";

type ProposalCardDrop = ComponentProps<typeof ProposalCardContent>["drop"];

let mockProposalCardRecipe: {
  readonly version: 1;
  readonly layout: "summary";
  readonly excerptMaxCharacters: number;
  readonly showMediaThumbnail: boolean;
} | null = null;

jest.mock("@/hooks/waves/useWaveProposalCardRecipe", () => ({
  useWaveProposalCardRecipe: () => mockProposalCardRecipe,
}));

jest.mock("@/components/common/FallbackImage", () => ({
  FallbackImage: ({
    fallbackSrc,
    alt,
  }: {
    readonly fallbackSrc: string;
    readonly alt: string;
  }) => <img src={fallbackSrc} alt={alt} />,
}));

const proposal = {
  id: "proposal-1",
  wave: { id: "wave-1" },
  title: null,
  parts_count: 3,
  parts: [
    {
      part_id: 1,
      content:
        "# Donation Proposal: Token #0\n\nThis is authored proposal text, not a generated summary.",
      media: [{ url: "token.jpg", mime_type: "image/jpeg" }],
      attachments: [
        {
          attachment_id: "terms.pdf",
          file_name: "terms.pdf",
          mime_type: ApiAttachmentUploadMimeType.ApplicationPdf,
          kind: ApiAttachmentKind.Pdf,
          status: ApiAttachmentStatus.Ready,
        },
      ],
      quoted_drop: null,
    },
    {
      part_id: 2,
      content: "Supporting details",
      media: [{ url: "detail.mp4", mime_type: "video/mp4" }],
      attachments: [],
      quoted_drop: null,
    },
  ],
  nft_links: [],
} satisfies ProposalCardDrop;

describe("ProposalCardContent", () => {
  beforeEach(() => {
    mockProposalCardRecipe = null;
  });

  it("renders authored compact content and only real proposal context", () => {
    render(<ProposalCardContent drop={proposal} />);

    expect(
      screen.queryByText("Proposal", { exact: true })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Donation Proposal: Token #0",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is authored proposal text, not a generated summary. Supporting details"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("3 parts")).toBeInTheDocument();
    expect(screen.getByText("2 media items")).toBeInTheDocument();
    expect(screen.getByText("1 attachment")).toBeInTheDocument();
    expect(screen.queryByText("Read full")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Media preview for Donation Proposal: Token #0",
      })
    ).toHaveAttribute("src", "token.jpg");
  });

  it("does not add a summary or invented context to a very short proposal", () => {
    render(
      <ProposalCardContent
        drop={{
          ...proposal,
          id: "proposal-short",
          parts_count: 1,
          parts: [
            {
              part_id: 1,
              content: "Approve the archive transfer.",
              media: [],
              attachments: [],
              quoted_drop: null,
            },
          ],
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Approve the archive transfer." })
    ).toBeInTheDocument();
    expect(screen.queryByText("1 part")).not.toBeInTheDocument();
    expect(screen.queryByText(/summary/i)).not.toBeInTheDocument();
  });

  it("applies the wave recipe to the rendered card", () => {
    mockProposalCardRecipe = {
      version: 1,
      layout: "summary",
      excerptMaxCharacters: 360,
      showMediaThumbnail: false,
    };

    render(<ProposalCardContent drop={proposal} />);

    expect(
      screen.queryByRole("img", {
        name: "Media preview for Donation Proposal: Token #0",
      })
    ).not.toBeInTheDocument();
  });
});
