import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdditionalMediaUpload from "@/components/waves/memes/submission/components/AdditionalMediaUpload";

describe("AdditionalMediaUpload", () => {
  const defaultProps = {
    supportingMedia: [],
    artworkCommentary: "",
    aboutArtist: "",
    previewImage: "",
    requiresPreviewImage: false,
    previewRequiredMediaType: null,
    onSupportingMediaChange: jest.fn(),
    onPreviewImageChange: jest.fn(),
    onArtworkCommentaryChange: jest.fn(),
    onAboutArtistChange: jest.fn(),
  };

  it("renders supporting media section and commentary field", () => {
    render(<AdditionalMediaUpload {...defaultProps} />);
    expect(screen.getByText(/Supporting Media/i)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Artwork Commentary/i })
    ).toBeInTheDocument();
  });

  it("shows preview image section when video submission", () => {
    render(<AdditionalMediaUpload {...defaultProps} requiresPreviewImage previewRequiredMediaType="Video" />);
    expect(screen.getByText(/Preview Image \*/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Video submissions require a preview image/i)
    ).toBeInTheDocument();
  });

  it("does not show preview image section for regular submissions", () => {
    render(<AdditionalMediaUpload {...defaultProps} requiresPreviewImage={false} />);
    expect(screen.queryByText(/Preview Image \*/i)).not.toBeInTheDocument();
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
      name: /Artwork Commentary/i,
    });
    await user.type(textarea, "T");

    expect(onArtworkCommentaryChange).toHaveBeenCalled();
  });
});
