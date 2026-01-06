import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdditionalMediaUpload from "@/components/waves/memes/submission/components/AdditionalMediaUpload";

describe("AdditionalMediaUpload", () => {
  const defaultProps = {
    artworkCommentaryMedia: [],
    artworkCommentary: "",
    onArtworkCommentaryMediaChange: jest.fn(),
    onArtworkCommentaryChange: jest.fn(),
  };

  it("renders commentary media section and commentary field", () => {
    render(<AdditionalMediaUpload {...defaultProps} />);
    expect(screen.getByText(/Artwork Commentary Media/i)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /^Artwork Commentary$/i })
    ).toBeInTheDocument();
  });

  it("calls onArtworkCommentaryChange when commentary is updated", async () => {
    const user = userEvent.setup();
    const onArtworkCommentaryChange = jest.fn();
    render(
      <AdditionalMediaUpload
        {...defaultProps}
        onArtworkCommentaryChange={onArtworkCommentaryChange}
      />
    );

    const textarea = screen.getByRole("textbox", {
      name: /^Artwork Commentary$/i,
    });
    await user.type(textarea, "This is my commentary");
    await user.tab();

    expect(onArtworkCommentaryChange).toHaveBeenCalledWith(
      "This is my commentary"
    );
  });
});
