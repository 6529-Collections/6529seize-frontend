import { render, screen } from "@testing-library/react";
import { WaveDropAdditionalInfo } from "@/components/waves/drop/WaveDropAdditionalInfo";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt ?? ""} />,
}));

const buildDrop = (metadata: { data_key: string; data_value: string }[]) =>
  ({ metadata } as any);

describe("WaveDropAdditionalInfo", () => {
  it("does not render when there is no commentary or media", () => {
    const { container } = render(
      <WaveDropAdditionalInfo drop={buildDrop([])} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders commentary when provided", () => {
    render(
      <WaveDropAdditionalInfo
        drop={buildDrop([
          {
            data_key: MemesSubmissionAdditionalInfoKey.COMMENTARY,
            data_value: "Process notes here.",
          },
        ])}
      />
    );

    expect(screen.getByText("Artwork Commentary")).toBeInTheDocument();
    expect(screen.getByText("Process notes here.")).toBeInTheDocument();
  });

  it("renders up to four media items", () => {
    const additionalMedia = JSON.stringify({
      artist_profile_media: [],
      artwork_commentary_media: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
        "https://example.com/5.jpg",
      ],
    });

    render(
      <WaveDropAdditionalInfo
        drop={buildDrop([
          {
            data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
            data_value: additionalMedia,
          },
        ])}
      />
    );

    expect(screen.getByText("Additional Media")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(4);
  });

  it("renders promo video when provided", () => {
    const additionalMedia = JSON.stringify({
      artist_profile_media: [],
      artwork_commentary_media: [],
      preview_image: "",
      promo_video: "https://example.com/promo.mp4",
    });

    render(
      <WaveDropAdditionalInfo
        drop={buildDrop([
          {
            data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
            data_value: additionalMedia,
          },
        ])}
      />
    );

    expect(screen.getByText("Promo Video")).toBeInTheDocument();
  });

  it("does not render promo video section when not provided", () => {
    const additionalMedia = JSON.stringify({
      artist_profile_media: [],
      artwork_commentary_media: [],
      preview_image: "https://example.com/preview.jpg",
    });

    render(
      <WaveDropAdditionalInfo
        drop={buildDrop([
          {
            data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
            data_value: additionalMedia,
          },
        ])}
      />
    );

    expect(screen.queryByText("Promo Video")).not.toBeInTheDocument();
  });
});
