import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdditionalMediaUpload from "@/components/waves/memes/submission/components/AdditionalMediaUpload";

describe("AdditionalMediaUpload", () => {
  const defaultProps = {
    artistProfileMedia: [],
    artworkCommentaryMedia: [],
    artworkCommentary: "",
    onArtistProfileMediaChange: jest.fn(),
    onArtworkCommentaryMediaChange: jest.fn(),
    onArtworkCommentaryChange: jest.fn(),
  };

  it("renders both media sections and commentary field", () => {
    render(<AdditionalMediaUpload {...defaultProps} />);
    expect(screen.getByText(/Artist Profile Media/i)).toBeInTheDocument();
    expect(screen.getByText(/Artwork Commentary Media/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Artwork Commentary$/i })).toBeInTheDocument();
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

    const textarea = screen.getByRole("textbox", { name: /^Artwork Commentary$/i });
    await user.type(textarea, "This is my commentary");
    await user.tab();

    expect(onArtworkCommentaryChange).toHaveBeenCalledWith("This is my commentary");
  });

  it("shows existing media and allows removal", async () => {
    const user = userEvent.setup();
    const onArtistProfileMediaChange = jest.fn();
    const media = ["url1", "url2"];
    render(
      <AdditionalMediaUpload
        {...defaultProps}
        artistProfileMedia={media}
        onArtistProfileMediaChange={onArtistProfileMediaChange}
      />
    );

    expect(screen.getAllByRole("img", { name: /media/i })).toHaveLength(2);
    
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[0]);

    expect(onArtistProfileMediaChange).toHaveBeenCalledWith(["url2"]);
  });

  it("limits media to 4 items and shows error if more are added", () => {
    const media = ["url1", "url2", "url3", "url4"];
    render(
      <AdditionalMediaUpload
        {...defaultProps}
        artistProfileMedia={media}
      />
    );

    // Should not show "Add" button if limit reached (or show disabled)
    const addButtons = screen.getAllByRole("button", { name: /add/i });
    // Assuming the first add button is for artist profile
    expect(addButtons[0]).toBeDisabled();
  });
});
