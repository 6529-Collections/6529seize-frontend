import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdditionalMediaUpload from "@/components/waves/memes/submission/components/AdditionalMediaUpload";

describe("AdditionalMediaUpload", () => {
  const defaultProps = {
    supportingMedia: [],
    artworkCommentary: "",
    aboutArtist: "",
    previewImage: "",
    promoVideo: "",
    requiresPreviewImage: false,
    requiresPromoVideoOption: false,
    previewRequiredMediaType: null,
    onSupportingMediaChange: jest.fn(),
    onPreviewImageChange: jest.fn(),
    onPromoVideoChange: jest.fn(),
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

  it("shows preview section when video submission", () => {
    render(<AdditionalMediaUpload {...defaultProps} requiresPreviewImage previewRequiredMediaType="Video" />);
    expect(screen.getByText(/Preview \*/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Video submissions require a preview image/i)
    ).toBeInTheDocument();
  });

  it("does not show preview section for regular submissions", () => {
    render(<AdditionalMediaUpload {...defaultProps} requiresPreviewImage={false} />);
    expect(screen.queryByText(/Preview \*/i)).not.toBeInTheDocument();
  });

  it("shows promo video section for HTML submissions", () => {
    render(<AdditionalMediaUpload {...defaultProps} requiresPreviewImage requiresPromoVideoOption previewRequiredMediaType="HTML" />);
    expect(screen.getByText("Promo Video")).toBeInTheDocument();
    expect(
      screen.getByText(/For HTML submissions, we recommend providing a promo video/i)
    ).toBeInTheDocument();
  });

  it("does not show promo video section for video submissions", () => {
    render(<AdditionalMediaUpload {...defaultProps} requiresPreviewImage requiresPromoVideoOption={false} previewRequiredMediaType="Video" />);
    expect(screen.queryByText("Promo Video")).not.toBeInTheDocument();
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
