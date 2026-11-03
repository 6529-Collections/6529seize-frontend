import { fireEvent, render, screen } from "@testing-library/react";
import ProposalCardReadFullButton from "@/components/waves/drops/proposal/ProposalCardReadFullButton";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

describe("ProposalCardReadFullButton", () => {
  it("opens the exact video artwork through its clearly named action", () => {
    const drop = {
      id: "video",
      title: "Squiggle",
      parts_count: 1,
      parts: [
        {
          content: null,
          media: [{ url: "clip.mp4", mime_type: "video/mp4" }],
          attachments: [],
        },
      ],
      nft_links: [],
    } as unknown as ExtendedDrop;
    const onReadFull = jest.fn();
    render(<ProposalCardReadFullButton drop={drop} onReadFull={onReadFull} />);
    fireEvent.click(
      screen.getByRole("button", { name: "View artwork: Squiggle" })
    );
    expect(onReadFull).toHaveBeenCalledWith(drop);
  });
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
                quoted_drop: null,
              },
            ],
            nft_links: [],
          } satisfies Partial<ExtendedDrop> as unknown as ExtendedDrop
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
