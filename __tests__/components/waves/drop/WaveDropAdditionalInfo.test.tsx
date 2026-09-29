import { forwardRef, type ComponentProps } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { WaveDropAdditionalInfo } from "@/components/waves/drop/WaveDropAdditionalInfo";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";
import type SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { downloadMediaUrl } from "@/helpers/media-download.helpers";

type MockImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean;
  readonly unoptimized?: boolean;
};

const mockVideoPlayer = jest.fn(
  (props: ComponentProps<typeof SeizeVideoPlayer>) => (
    <div>
      <video data-testid="video-player" preload={props.preload} />
      {props.onOpen && (
        <button onClick={props.onOpen}>{props.openLabel}</button>
      )}
      <button onClick={props.onDownload} disabled={props.isDownloading}>
        Download video
      </button>
    </div>
  )
);

jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockImageProps>(function MockImage(
    { fill: _fill, unoptimized: _unoptimized, alt, ...props },
    ref
  ) {
    return <img {...props} ref={ref} alt={alt ?? ""} />;
  }),
}));

jest.mock(
  "@/components/drops/view/item/content/media/SeizeVideoPlayer",
  () => ({
    __esModule: true,
    default: (props: ComponentProps<typeof SeizeVideoPlayer>) =>
      mockVideoPlayer(props),
  })
);

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(() => "en-US"),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));
jest.mock("@/hooks/useInView", () => ({ useInView: () => [jest.fn(), true] }));
jest.mock("@/hooks/useFullScreenSupported", () => ({
  useFullScreenSupported: () => true,
}));
jest.mock("@/helpers/media-download.helpers", () => ({
  downloadMediaUrl: jest.fn().mockResolvedValue(undefined),
  getDownloadFilenameFromUrl: () => "media",
  triggerDirectDownload: jest.fn(),
}));

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) =>
    url.startsWith("ipfs://")
      ? `https://ipfs-gateway.test/ipfs/${url.slice(7)}`
      : url,
}));

const buildDrop = (metadata: { data_key: string; data_value: string }[]) =>
  ({ metadata }) as ExtendedDrop;

describe("WaveDropAdditionalInfo", () => {
  beforeEach(() => {
    jest.mocked(downloadMediaUrl).mockClear();
    mockVideoPlayer.mockClear();
    jest.mocked(useBrowserLocale).mockReturnValue("en-US");
  });

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
    expect(mockVideoPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ preload: "metadata", layout: "prominent" })
    );
  });

  it("does not preload additional videos below the fold", () => {
    const additionalMedia = JSON.stringify({
      artist_profile_media: [],
      artwork_commentary_media: ["https://example.com/process.mp4"],
      preview_image: "",
      promo_video: "",
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

    expect(mockVideoPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ preload: "none", layout: "fill" })
    );
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

  it("resolves IPFS preview images without automatically loading the original", () => {
    const previewImage = "ipfs://preview-image";
    const resolvedPreviewImage = "https://ipfs-gateway.test/ipfs/preview-image";
    const additionalMedia = JSON.stringify({
      artist_profile_media: [],
      artwork_commentary_media: [],
      preview_image: previewImage,
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

    const image = screen.getByRole("img", { name: "Preview image" });
    expect(image.getAttribute("src")).toContain(
      encodeURIComponent(resolvedPreviewImage)
    );
    expect(image).not.toHaveAttribute("src", resolvedPreviewImage);
  });

  it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
    "keeps headings and distinct image names available through %s fallback",
    (locale) => {
      jest.mocked(useBrowserLocale).mockReturnValue(locale);
      render(
        <WaveDropAdditionalInfo
          drop={buildDrop([
            {
              data_key: MemesSubmissionAdditionalInfoKey.ABOUT_ARTIST,
              data_value: "Artist bio",
            },
            {
              data_key: MemesSubmissionAdditionalInfoKey.COMMENTARY,
              data_value: "Artist commentary",
            },
            {
              data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
              data_value: JSON.stringify({
                preview_image: "https://example.com/preview.jpg",
                promo_video: "https://example.com/promo.mp4",
                artwork_commentary_media: [
                  "https://example.com/one.jpg",
                  "https://example.com/two.jpg",
                ],
              }),
            },
          ])}
        />
      );
      for (const heading of [
        "Preview Image",
        "Promo Video",
        "Additional Media",
        "About the Artist",
        "Artwork Commentary",
      ]) {
        expect(
          screen.getByRole("heading", { name: heading })
        ).toBeInTheDocument();
      }
      for (const name of [
        "Preview image",
        "Additional media 1",
        "Additional media 2",
      ]) {
        expect(screen.getByRole("img", { name })).toBeInTheDocument();
      }
      expect(
        screen.getByRole("button", { name: "Open preview image" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Open additional media 1" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Open additional media 2" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Open in new tab" })
      ).toBeInTheDocument();
    }
  );

  it("opens each supplemental image with actions for its own original URL", async () => {
    const urls = [
      "https://example.com/preview.jpg",
      "https://example.com/extra.jpg",
    ];
    const open = jest
      .spyOn(globalThis.window, "open")
      .mockImplementation(() => null);
    render(
      <WaveDropAdditionalInfo
        drop={buildDrop([
          {
            data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
            data_value: JSON.stringify({
              preview_image: urls[0],
              artwork_commentary_media: [urls[1]],
            }),
          },
        ])}
      />
    );

    for (const [index, url] of urls.entries()) {
      fireEvent.load(
        screen.getAllByRole("img", {
          name: /^(Preview image|Additional media \d+)$/,
        })[index]!
      );
      fireEvent.click(
        screen.getAllByRole("button", {
          name: /^Open (preview image|additional media \d+)$/,
        })[index]!
      );
      const image = screen.getByRole("img", { name: "Expanded image preview" });
      expect(image.getAttribute("src")).toContain(encodeURIComponent(url));
      const modal = screen.getByRole("button", {
        name: "Close media",
      }).parentElement!;
      expect(
        within(modal).getByRole("button", { name: "Full screen" })
      ).toBeInTheDocument();
      fireEvent.click(
        within(modal).getByRole("button", { name: "Open in new tab" })
      );
      expect(open).toHaveBeenLastCalledWith(
        url,
        "_blank",
        "noopener,noreferrer"
      );
      fireEvent.click(
        within(modal).getByRole("button", { name: "Download media" })
      );
      await waitFor(() =>
        expect(downloadMediaUrl).toHaveBeenLastCalledWith(
          expect.objectContaining({ url })
        )
      );
      fireEvent.click(screen.getByRole("button", { name: "Close media" }));
      expect(
        screen.queryByRole("img", { name: "Expanded image preview" })
      ).not.toBeInTheDocument();
    }
    open.mockRestore();
  });

  it("offers original-file actions on promo and supporting videos without changing preloads", async () => {
    const promo = "https://example.com/promo.mp4";
    const supporting = "https://example.com/support.MOV?version=1";
    const open = jest
      .spyOn(globalThis.window, "open")
      .mockImplementation(() => null);
    render(
      <WaveDropAdditionalInfo
        drop={buildDrop([
          {
            data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
            data_value: JSON.stringify({
              promo_video: promo,
              artwork_commentary_media: [supporting],
            }),
          },
        ])}
      />
    );
    const videos = screen.getAllByTestId("video-player");
    expect(videos[0]).toHaveAttribute("preload", "metadata");
    expect(videos[1]).toHaveAttribute("preload", "none");
    expect(
      screen.getAllByRole("button", { name: "Open in new tab" })
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Open in new tab" }));
    expect(open).toHaveBeenCalledWith(promo, "_blank", "noopener,noreferrer");
    for (const [index, url] of [promo, supporting].entries()) {
      fireEvent.click(
        screen.getAllByRole("button", { name: "Download video" })[index]!
      );
      await waitFor(() =>
        expect(downloadMediaUrl).toHaveBeenLastCalledWith(
          expect.objectContaining({ url })
        )
      );
    }
    open.mockRestore();
  });
});
