import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CurationWavePreviewCard } from "@/components/waves/drops/CurationWavePreviewCard";
import type { PreviewDrop } from "@/components/waves/drops/curation-preview/types";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useProfileWave } from "@/hooks/useProfileWave";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveCurationPreviewDrops } from "@/hooks/useWaveCurationPreviewDrops";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { useWaves } from "@/hooks/useWaves";

jest.mock("@/hooks/useProfileWave", () => ({
  useProfileWave: jest.fn(),
}));

jest.mock("@/hooks/useWaveById", () => ({
  useWaveById: jest.fn(),
}));

jest.mock("@/hooks/useWaveCurationPreviewDrops", () => ({
  useWaveCurationPreviewDrops: jest.fn(),
}));

jest.mock("@/hooks/waves/useWaveCurations", () => ({
  useWaveCurations: jest.fn(),
}));

jest.mock("@/hooks/useWaves", () => ({
  useWaves: jest.fn(),
}));

jest.mock("@/components/utils/CommonIntersectionElement", () => ({
  __esModule: true,
  default: () => <div data-testid="intersection-sentinel" />,
}));

jest.mock("@/components/common/FallbackImage", () => ({
  FallbackImage: ({
    alt,
    fallbackSrc,
    primarySrc,
  }: {
    readonly alt: string;
    readonly fallbackSrc: string;
    readonly primarySrc: string;
  }) =>
    React.createElement("img", {
      alt,
      src: primarySrc || fallbackSrc,
      "data-testid": "fallback-image",
      "data-fallback-src": fallbackSrc,
      "data-primary-src": primarySrc,
    }),
}));

jest.mock("@/helpers/image.helpers", () => ({
  ImageScale: {
    W_AUTO_H_50: "W_AUTO_H_50",
    W_200_H_200: "W_200_H_200",
  },
  getScaledImageUri: jest.fn((url: string) => `scaled:${url}`),
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <span data-testid="wave-fallback-icon" />,
}));

jest.mock("@heroicons/react/24/outline", () => ({
  ArrowRightIcon: () => (
    <span aria-hidden="true" data-testid="arrow-right-icon" />
  ),
  ArrowTopRightOnSquareIcon: () => (
    <span aria-hidden="true" data-testid="arrow-top-right-icon" />
  ),
  ChatBubbleLeftRightIcon: () => (
    <span aria-hidden="true" data-testid="chat-icon" />
  ),
  ChevronDownIcon: () => (
    <span aria-hidden="true" data-testid="chevron-down-icon" />
  ),
  ChevronRightIcon: () => (
    <span aria-hidden="true" data-testid="chevron-right-icon" />
  ),
  LinkIcon: () => <span aria-hidden="true" />,
  PlayIcon: () => <span aria-hidden="true" data-testid="video-play-icon" />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
    readonly prefetch?: boolean;
    readonly className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const useProfileWaveMock = useProfileWave as jest.Mock;
const useWaveByIdMock = useWaveById as jest.Mock;
const useWaveCurationPreviewDropsMock =
  useWaveCurationPreviewDrops as jest.Mock;
const useWaveCurationsMock = useWaveCurations as jest.Mock;
const useWavesMock = useWaves as jest.Mock;
const getScaledImageUriMock = getScaledImageUri as jest.Mock;

const createWave = (): ApiWave =>
  ({
    id: "wave-1",
    name: "Profile Wave",
    picture: "https://example.com/wave.png",
    author: {
      banner1_color: null,
      banner2_color: null,
      handle: "alice",
      primary_address: "0xabc",
    },
    chat: {
      scope: {
        group: {
          is_direct_message: false,
        },
      },
    },
    description_drop: {
      parts: [],
    },
  }) as ApiWave;

const createCreatedWave = (): ApiWave =>
  ({
    id: "created-wave-1",
    name: "Created Wave",
    picture: null,
    chat: {
      scope: {
        group: {
          is_direct_message: false,
        },
      },
    },
    metrics: {
      latest_drop_timestamp: null,
    },
  }) as ApiWave;

const createPreviewDrop = ({
  kind,
  mediaPreviewUrl,
  mediaUri = null,
  mimeType,
}: {
  readonly kind: "image" | "video";
  readonly mediaPreviewUrl: string;
  readonly mediaUri?: string | null;
  readonly mimeType: string;
}): PreviewDrop => ({
  id: `drop-${kind}-${mediaPreviewUrl}`,
  title: null,
  parts: [
    {
      content: null,
      media: [],
    },
  ],
  nft_links: [
    {
      url_in_text: "https://transient.xyz/nfts/ethereum/0xabc/1",
      data: {
        media_uri: mediaUri,
        media_preview: {
          status: "READY",
          kind,
          card_url: mediaPreviewUrl,
          small_url: null,
          thumb_url: null,
          width: 640,
          height: 360,
          mime_type: mimeType,
        },
      },
    },
  ],
});

const mockResolvedProfileCurationDrops = (drops: readonly PreviewDrop[]) => {
  useProfileWaveMock.mockReturnValue({
    data: {
      profile_curation_id: "curation-1",
      profile_wave_id: "wave-1",
    },
    isError: false,
  });
  useWaveCurationPreviewDropsMock.mockReturnValue({
    drops,
    isError: false,
    isFetched: true,
  });
};

const getFallbackImagesForSrc = (src: string): HTMLElement[] =>
  screen
    .queryAllByTestId("fallback-image")
    .filter((image) => image.dataset.fallbackSrc === src);

describe("CurationWavePreviewCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useWaveByIdMock.mockReturnValue({
      isError: false,
      wave: createWave(),
    });
    useProfileWaveMock.mockReturnValue({
      data: undefined,
      isError: false,
    });
    useWaveCurationsMock.mockReturnValue({
      data: [],
      isError: false,
      isFetched: true,
    });
    useWaveCurationPreviewDropsMock.mockReturnValue({
      drops: [],
      isError: false,
      isFetched: false,
    });
    useWavesMock.mockReturnValue({
      waves: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      error: null,
    });
  });

  it("keeps loading visible while fallback curations have not resolved", () => {
    useWaveCurationsMock.mockReturnValue({
      data: undefined,
      isError: false,
      isFetched: false,
    });

    render(<CurationWavePreviewCard waveId="wave-1" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading...");
    expect(screen.queryByText("No curated drops yet.")).not.toBeInTheDocument();
  });

  it("keeps loading visible while preview drops have not resolved", () => {
    useProfileWaveMock.mockReturnValue({
      data: {
        profile_curation_id: "curation-1",
        profile_wave_id: "wave-1",
      },
      isError: false,
    });

    render(<CurationWavePreviewCard waveId="wave-1" profileIdentity="alice" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading...");
    expect(screen.queryByText("No curated drops yet.")).not.toBeInTheDocument();
  });

  it("omits empty copy after preview drops resolve with no items", () => {
    useProfileWaveMock.mockReturnValue({
      data: {
        profile_curation_id: "curation-1",
        profile_wave_id: "wave-1",
      },
      isError: false,
    });
    useWaveCurationPreviewDropsMock.mockReturnValue({
      drops: [],
      isError: false,
      isFetched: true,
    });

    render(<CurationWavePreviewCard waveId="wave-1" profileIdentity="alice" />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText("No curated drops yet.")).not.toBeInTheDocument();
    expect(getScaledImageUriMock).toHaveBeenCalledWith(
      "https://example.com/wave.png",
      ImageScale.W_AUTO_H_50
    );
    expect(
      screen.queryByText("Profile wave", { selector: "span" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open profile wave" })
    ).toBeVisible();
  });

  it("expands created waves in place and keeps profile navigation explicit", () => {
    useWavesMock.mockReturnValue({
      waves: [createCreatedWave()],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      error: null,
    });

    render(<CurationWavePreviewCard waveId="wave-1" profileIdentity="alice" />);

    const showAllButton = screen.getByRole("button", {
      name: "Show all waves",
    });

    expect(showAllButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: "Created waves" })
    ).not.toBeInTheDocument();

    fireEvent.click(showAllButton);

    const createdWavesPanel = screen.getByRole("region", {
      name: "Created waves",
    });
    const hideButton = screen.getByRole("button", { name: "Hide waves" });
    const controlsId = hideButton.getAttribute("aria-controls");

    expect(hideButton).toHaveAttribute("aria-expanded", "true");
    expect(controlsId).toBeTruthy();
    expect(createdWavesPanel).toHaveAttribute("id", controlsId ?? "");
    expect(
      within(createdWavesPanel).getByRole("link", {
        name: "Show all brain activity",
      })
    ).toHaveAttribute("href", "/alice/brain");
    expect(
      within(createdWavesPanel).getByRole("link", { name: /Created Wave/ })
    ).toHaveAttribute("href", "/waves/created-wave-1");
    expect(useWavesMock).toHaveBeenCalledWith({
      identity: "alice",
      waveName: null,
      limit: 20,
      enabled: true,
      directMessage: false,
    });

    fireEvent.click(hideButton);

    expect(
      screen.getByRole("button", { name: "Show all waves" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: "Created waves" })
    ).not.toBeInTheDocument();
  });

  it("omits the all-waves disclosure without a profile identity", () => {
    render(<CurationWavePreviewCard waveId="wave-1" />);

    expect(
      screen.queryByRole("button", { name: "Show all waves" })
    ).not.toBeInTheDocument();
  });

  it("renders image preview media as an image tile", () => {
    const imageUrl = "https://cdn.example.com/artwork.webp";
    mockResolvedProfileCurationDrops([
      createPreviewDrop({
        kind: "image",
        mediaPreviewUrl: imageUrl,
        mimeType: "image/webp",
      }),
    ]);

    render(<CurationWavePreviewCard waveId="wave-1" profileIdentity="alice" />);

    expect(getFallbackImagesForSrc(imageUrl)).toHaveLength(1);
    expect(screen.queryByTestId("video-play-icon")).not.toBeInTheDocument();
  });

  it("renders video preview thumbnails with a play indicator", () => {
    const thumbnailUrl = "https://cdn.example.com/video-thumbnail.webp";
    mockResolvedProfileCurationDrops([
      createPreviewDrop({
        kind: "video",
        mediaPreviewUrl: thumbnailUrl,
        mediaUri: "https://cdn.example.com/video.mp4",
        mimeType: "video/mp4",
      }),
    ]);

    render(<CurationWavePreviewCard waveId="wave-1" profileIdentity="alice" />);

    expect(getFallbackImagesForSrc(thumbnailUrl)).toHaveLength(1);
    expect(screen.getByTestId("video-play-icon")).toBeInTheDocument();
  });

  it("renders a video placeholder for direct video preview urls", () => {
    const videoUrl = "https://cdn.example.com/video.mp4";
    mockResolvedProfileCurationDrops([
      createPreviewDrop({
        kind: "video",
        mediaPreviewUrl: videoUrl,
        mimeType: "image/webp",
      }),
    ]);

    render(<CurationWavePreviewCard waveId="wave-1" profileIdentity="alice" />);

    expect(getFallbackImagesForSrc(videoUrl)).toHaveLength(0);
    expect(screen.getByLabelText("Curated video")).toBeInTheDocument();
    expect(screen.getByTestId("video-play-icon")).toBeInTheDocument();
  });
});
