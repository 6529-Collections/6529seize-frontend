import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CurationWavePreviewCard } from "@/components/waves/drops/CurationWavePreviewCard";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useProfileWave } from "@/hooks/useProfileWave";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveCurationPreviewDrops } from "@/hooks/useWaveCurationPreviewDrops";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";

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

jest.mock("@/components/common/FallbackImage", () => ({
  FallbackImage: ({
    alt,
    fallbackSrc,
    primarySrc,
  }: {
    readonly alt: string;
    readonly fallbackSrc: string;
    readonly primarySrc: string;
  }) => <img alt={alt} src={primarySrc || fallbackSrc} />,
}));

jest.mock("@/helpers/image.helpers", () => ({
  ImageScale: {
    W_200_H_200: "W_200_H_200",
  },
  getScaledImageUri: (url: string) => `scaled:${url}`,
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <span data-testid="wave-fallback-icon" />,
}));

jest.mock("@heroicons/react/24/outline", () => ({
  ArrowRightIcon: () => <span aria-hidden="true" />,
  LinkIcon: () => <span aria-hidden="true" />,
  PlayIcon: () => <span aria-hidden="true" />,
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

const createWave = (): ApiWave =>
  ({
    id: "wave-1",
    name: "Profile Wave",
    picture: null,
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
    expect(screen.getByRole("link", { name: /open wave/i })).toBeVisible();
  });
});
