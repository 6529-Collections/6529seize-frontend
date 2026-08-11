import { render, screen } from "@testing-library/react";
import ProposalCardReadFullButton from "@/components/waves/drops/proposal/ProposalCardReadFullButton";

describe("ProposalCardReadFullButton", () => {
  it("uses the proposal card's inferred title in its accessible name", () => {
    render(
      <ProposalCardReadFullButton
        drop={
          {
            id: "proposal-1",
            title: null,
            parts_count: 1,
            parts: [
              {
                part_id: 1,
                content:
                  "# Still-image preview example\n\nSupporting proposal text.",
                media: [],
                attachments: [],
              },
            ],
            nft_links: [],
          } as any
        }
        onReadFull={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", {
        name: "Read full: Still-image preview example",
      })
    ).toBeInTheDocument();
  });
});
