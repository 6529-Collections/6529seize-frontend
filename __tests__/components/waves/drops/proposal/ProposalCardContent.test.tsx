import { render, screen } from "@testing-library/react";
import ProposalCardContent from "@/components/waves/drops/proposal/ProposalCardContent";

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
  title: null,
  parts_count: 3,
  parts: [
    {
      part_id: 1,
      content:
        "# Donation Proposal: Token #0\n\nThis is authored proposal text, not a generated summary.",
      media: [{ url: "token.jpg", mime_type: "image/jpeg" }],
      attachments: [{ name: "terms.pdf" }],
    },
    {
      part_id: 2,
      content: "Supporting details",
      media: [{ url: "detail.mp4", mime_type: "video/mp4" }],
      attachments: [],
    },
  ],
  nft_links: [],
} as any;

describe("ProposalCardContent", () => {
  it("renders authored compact content and only real proposal context", () => {
    render(<ProposalCardContent drop={proposal} />);

    expect(screen.getByText("Proposal")).toBeInTheDocument();
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
    expect(screen.getByText("Open full proposal")).toBeInTheDocument();
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
});
