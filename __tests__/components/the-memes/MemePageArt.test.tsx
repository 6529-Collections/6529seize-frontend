import { MemePageArt } from "@/components/the-memes/MemePageArt";
import { formatNumber, roundTo } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/download/Download", () => ({
  __esModule: true,
  default: ({
    href,
    labels,
  }: {
    href: string;
    labels?: { downloadFile?: string; download?: string };
  }) => (
    <button
      type="button"
      data-testid="download"
      data-href={href}
      aria-label={labels?.downloadFile ?? "Download file"}
    >
      {labels?.download ?? "Download"}
    </button>
  ),
}));

jest.mock("@/components/the-memes/MemePageMainStageSubmissionLink", () => ({
  __esModule: true,
  default: () => <div data-testid="main-stage-submission-link" />,
}));

jest.mock("@/helpers/Helpers", () => ({
  numberWithCommas: (n: number) => String(n),
}));

jest.mock("@/helpers/nft.helpers", () => ({
  getAnimationDimensionsFromMetadata: jest.fn(),
  getAnimationFileTypeFromMetadata: jest.fn(),
  getImageDimensionsFromMetadata: jest.fn(),
  getImageFileTypeFromMetadata: jest.fn(),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: () => null,
}));

const mockNftHelpers = jest.requireMock("@/helpers/nft.helpers") as {
  getAnimationDimensionsFromMetadata: jest.Mock;
  getAnimationFileTypeFromMetadata: jest.Mock;
  getImageDimensionsFromMetadata: jest.Mock;
  getImageFileTypeFromMetadata: jest.Mock;
};

const nft = {
  id: 5,
  name: "Test Meme",
  has_distribution: false,
  boosted_tdh: 12.345,
  tdh__raw: 4.56,
  tdh_rank: 7,
  collection: "The Memes",
  uri: "https://metadata.example/meme.json",
  image: "",
  animation: "",
  metadata: {
    image_details: { format: "png", width: 1, height: 2 },
    animation_details: { format: "gif", width: 1, height: 2 },
    attributes: [
      { trait_type: "Type - Season", value: "S1" },
      { trait_type: "Type - Meme", value: "M1" },
      { trait_type: "Type - Card", value: "C1" },
      { trait_type: "Other", value: "val" },
      { trait_type: "Boost", value: 10, display_type: "boost_percentage" },
    ],
    image: "https://media.example/img.png",
  },
};
const nftMeta = { season: 1, meme_name: "meme" };

beforeEach(() => {
  jest.clearAllMocks();
  mockNftHelpers.getAnimationFileTypeFromMetadata.mockReturnValue("gif");
  mockNftHelpers.getImageFileTypeFromMetadata.mockReturnValue("png");
  mockNftHelpers.getAnimationDimensionsFromMetadata.mockReturnValue("200x300");
  mockNftHelpers.getImageDimensionsFromMetadata.mockReturnValue("100x100");
});

describe("MemePageArt", () => {
  it("returns empty when missing data", () => {
    const { container } = render(
      <MemePageArt show={false} nft={undefined} nftMeta={undefined} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders current additional details sections when data is present", () => {
    render(
      <MemePageArt show={true} nft={nft as any} nftMeta={nftMeta as any} />
    );

    expect(
      screen.getByRole("heading", { name: /Arweave links/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "https://metadata.example/meme.json",
      })
    ).toHaveAttribute("href", "https://metadata.example/meme.json");
    expect(
      screen.getByRole("link", { name: "Open raw metadata in new tab" })
    ).toHaveAttribute("href", "https://metadata.example/meme.json");
    expect(
      screen.getByRole("link", { name: "Open image in new tab" })
    ).toHaveAttribute("href", "https://media.example/img.png");

    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText("val")).toBeInTheDocument();
    expect(screen.getByText("TDH breakdown")).toBeInTheDocument();
    expect(screen.getByText("12.35")).toBeInTheDocument();
    expect(screen.getByText("Unweighted TDH")).toBeInTheDocument();
    expect(screen.getByText("4.56")).toBeInTheDocument();
    expect(screen.getByText("Meme Rank")).toBeInTheDocument();
    expect(screen.getByText("#7")).toBeInTheDocument();
    expect(screen.getByText("Stats")).toBeInTheDocument();
    expect(screen.getByText("100x100")).toBeInTheDocument();
    expect(screen.getByText("S1")).toBeInTheDocument();
    expect(screen.getByText("M1")).toBeInTheDocument();
    expect(screen.getByText("C1")).toBeInTheDocument();
    expect(screen.getByText("Boosts")).toBeInTheDocument();
    expect(screen.getByText("+10%")).toBeInTheDocument();

    const submissionLink = screen.getByTestId("main-stage-submission-link");
    const arweaveHeading = screen.getByRole("heading", {
      name: /Arweave links/i,
    });
    expect(
      submissionLink.compareDocumentPosition(arweaveHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("uses locale-backed labels and number formatting", () => {
    render(
      <MemePageArt
        show={true}
        nft={nft as any}
        nftMeta={nftMeta as any}
        locale="de-DE"
      />
    );

    expect(
      screen.getByRole("heading", {
        name: t("de-DE", "theMemes.detail.art.sections.arweaveLinks"),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: t("de-DE", "theMemes.detail.art.links.openRawMetadata"),
      })
    ).toHaveAttribute("href", "https://metadata.example/meme.json");
    expect(
      screen.getByRole("button", {
        name: t("de-DE", "theMemes.detail.art.download.downloadFile"),
      })
    ).toHaveTextContent(t("de-DE", "theMemes.detail.art.download.download"));
    expect(
      screen.getByText(
        formatNumber("de-DE", roundTo(nft.boosted_tdh, 2), {
          maximumFractionDigits: 2,
        })
      )
    ).toBeInTheDocument();
  });

  it("shows an unranked TDH rank for memes not recorded in TDH", () => {
    render(
      <MemePageArt
        show={true}
        nft={{ ...nft, tdh_rank: -1 } as any}
        nftMeta={{ ...nftMeta, recorded_in_tdh: false } as any}
      />
    );

    expect(screen.getByText("Meme Rank")).toBeInTheDocument();
    expect(screen.getByText("Unranked")).toBeInTheDocument();
    expect(screen.queryByText("#-1")).not.toBeInTheDocument();
  });

  it("renders text display_type attributes in Properties", () => {
    const nftWithTextAttribute = {
      ...nft,
      metadata: {
        ...nft.metadata,
        attributes: [
          ...nft.metadata.attributes,
          {
            trait_type: "Artist",
            value: "RachelSTWood",
            display_type: "text",
          },
        ],
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithTextAttribute as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(screen.getByText("Artist")).toBeInTheDocument();
    expect(screen.getByText("RachelSTWood")).toBeInTheDocument();
  });

  it("constrains long Arweave URLs while preserving the full target", () => {
    const longUrl = `https://arweave.net/${"a".repeat(180)}`;
    const nftWithLongMetadataUrl = {
      ...nft,
      uri: longUrl,
      image: "",
      animation: "",
      metadata: {
        ...nft.metadata,
        image: "",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithLongMetadataUrl as any}
        nftMeta={nftMeta as any}
      />
    );

    const link = screen.getByRole("link", { name: longUrl });
    const row = link.closest("div");

    expect(link).toHaveAttribute("href", longUrl);
    expect(link).toHaveAttribute("title", longUrl);
    expect(link).toHaveClass("tw-block");
    expect(link).toHaveClass("tw-min-w-0");
    expect(link).toHaveClass("tw-max-w-full");
    expect(link).toHaveClass("tw-break-all");
    expect(link).toHaveClass("md:tw-truncate");
    expect(link).toHaveClass("md:tw-break-normal");
    expect(row).toHaveClass("tw-grid");
    expect(row).toHaveClass("tw-min-w-0");
    expect(row).toHaveClass(
      "md:tw-grid-cols-[4rem_minmax(10rem,16rem)_minmax(0,1fr)_auto]"
    );
  });

  it("falls back to top-level media URLs for art links", () => {
    const nftWithTopLevelMedia = {
      ...nft,
      image: "https://top-level.example/image.png",
      animation: "https://top-level.example/animation.mp4",
      metadata: {
        image_details: { format: "png", width: 1, height: 2 },
        animation_details: { format: "gif", width: 1, height: 2 },
        attributes: nft.metadata.attributes,
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithTopLevelMedia as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "https://top-level.example/image.png",
      })
    ).toHaveAttribute("href", "https://top-level.example/image.png");
    expect(
      screen.getByRole("link", {
        name: "https://top-level.example/animation.mp4",
      })
    ).toHaveAttribute("href", "https://top-level.example/animation.mp4");
    expect(
      screen.getByRole("link", { name: "Open image in new tab" })
    ).toHaveAttribute("href", "https://top-level.example/image.png");
    expect(
      screen.getByRole("link", { name: "Open animation in new tab" })
    ).toHaveAttribute("href", "https://top-level.example/animation.mp4");
  });

  it("prefers metadata animation_url over top-level animation for art links", () => {
    const nftWithMetadataAnimationUrl = {
      ...nft,
      animation: "https://cdn.example.com/animation.mp4",
      metadata: {
        ...nft.metadata,
        animation_url: "https://arweave.net/animation.mp4",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithMetadataAnimationUrl as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "https://arweave.net/animation.mp4",
      })
    ).toHaveAttribute("href", "https://arweave.net/animation.mp4");
    expect(
      screen.getByRole("link", { name: "Open animation in new tab" })
    ).toHaveAttribute("href", "https://arweave.net/animation.mp4");
  });

  it("ignores whitespace metadata.image and falls back to the top-level image", () => {
    const nftWithWhitespaceMetadataImage = {
      ...nft,
      image: "  https://top-level.example/image.png  ",
      metadata: {
        ...nft.metadata,
        image: "   ",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithWhitespaceMetadataImage as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "https://top-level.example/image.png",
      })
    ).toHaveAttribute("href", "https://top-level.example/image.png");
    expect(
      screen.getByRole("link", { name: "Open image in new tab" })
    ).toHaveAttribute("href", "https://top-level.example/image.png");
    expect(screen.getAllByTestId("download")[0]).toHaveAttribute(
      "data-href",
      "https://top-level.example/image.png"
    );
  });

  it("uses animation dimensions when metadata animation_url makes the card animated", () => {
    const nftWithAnimationUrlOnly = {
      ...nft,
      animation: "",
      metadata: {
        image_details: { format: "png", width: 1, height: 2 },
        animation_details: { format: "gif", width: 1, height: 2 },
        animation_url: "https://metadata.example/animation.gif",
        attributes: nft.metadata.attributes,
        image: "https://media.example/img.png",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithAnimationUrlOnly as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "https://metadata.example/animation.gif",
      })
    ).toHaveAttribute("href", "https://metadata.example/animation.gif");
    expect(screen.getByText("200x300")).toBeInTheDocument();
  });

  it("shows N/A dimensions for html art without dimension metadata", () => {
    mockNftHelpers.getAnimationFileTypeFromMetadata.mockReturnValue("html");
    mockNftHelpers.getAnimationDimensionsFromMetadata.mockReturnValue(
      undefined
    );

    const nftWithHtmlAnimation = {
      ...nft,
      image: "",
      animation: "",
      metadata: {
        image_details: undefined,
        animation_details: { format: "html" },
        animation_url: "https://metadata.example/animation.html",
        attributes: nft.metadata.attributes,
        image: "",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithHtmlAnimation as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "https://metadata.example/animation.html",
      })
    ).toHaveAttribute("href", "https://metadata.example/animation.html");
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
