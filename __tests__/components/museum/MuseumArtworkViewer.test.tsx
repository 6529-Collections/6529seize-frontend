import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { createElement } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CaseyArtwork } from "@/lib/museum/casey";

type MockNextImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  readonly fill?: boolean | undefined;
  readonly priority?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    alt,
    ...props
  }: MockNextImageProps) => createElement("img", { alt: alt ?? "", ...props }),
}));

import { MuseumArtworkViewer } from "@/components/museum/MuseumArtworkViewer";

const artwork: CaseyArtwork = {
  objectId: "6529NM.2026.001.01",
  title: "CENTURY #31",
  project: "CENTURY",
  projectSlug: "century",
  year: 2021,
  medium: "On-chain generative software associated with an ERC-721 token.",
  caip19:
    "eip155:1/erc721:0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031",
  imageUrl:
    "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png",
  generatorUrl:
    "https://generator.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031",
  visualDescription: "A governed visual description of the artwork.",
  observedImageSha256:
    "sha256:2769e41b8ea77a39b53103e31e1eaa52c04031c400062d309f7bf547792ba5da",
  creditLine: "Gift of punk6529.",
  rightsLabel: "CC BY-NC 4.0",
  rightsUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
  status: "accessioned",
  mediaRetention: "upstream_not_retained",
};

const viewLiveLabel = t(
  DEFAULT_LOCALE,
  "museum.network.artworkViewer.viewLive"
);
const returnToStillLabel = t(
  DEFAULT_LOCALE,
  "museum.network.artworkViewer.returnToStill"
);
const liveRecoveryLabel = t(
  DEFAULT_LOCALE,
  "museum.network.artworkViewer.liveRecovery"
);
const liveErrorTitle = t(
  DEFAULT_LOCALE,
  "museum.network.artworkViewer.liveErrorTitle"
);
const startingLiveLabel = t(
  DEFAULT_LOCALE,
  "museum.network.artworkViewer.startingLive"
);
const openOfficialSourceLabel = t(
  DEFAULT_LOCALE,
  "museum.network.artworkViewer.openOfficialSource"
);
const liveFrameTitle = t(
  DEFAULT_LOCALE,
  "museum.network.artworkViewer.liveTitle",
  { title: artwork.title }
);

function enterLiveMode() {
  const view = render(<MuseumArtworkViewer artwork={artwork} />);
  fireEvent.load(screen.getByRole("img", { name: artwork.visualDescription }));
  fireEvent.click(screen.getByRole("button", { name: viewLiveLabel }));

  return {
    ...view,
    liveFrame: screen.getByTitle(liveFrameTitle),
  };
}

describe("MuseumArtworkViewer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("keeps the live work visible and reveals recovery after 12 seconds", () => {
    const { container, liveFrame } = enterLiveMode();
    const liveFrames = container.querySelectorAll("iframe");
    expect(liveFrames).toHaveLength(1);
    expect(liveFrames[0]).toHaveAttribute("sandbox", "allow-scripts");
    expect(liveFrames[0]).toHaveAttribute("src", artwork.generatorUrl);
    expect(liveFrames[0]).toHaveAttribute("title", liveFrameTitle);

    fireEvent.load(liveFrame);

    expect(screen.getByText(startingLiveLabel)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: returnToStillLabel })
    ).toBeVisible();

    act(() => {
      jest.advanceTimersByTime(1_500);
    });
    expect(screen.queryByText(startingLiveLabel)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10_499);
    });
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.queryByText(liveErrorTitle)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: returnToStillLabel })
    ).toBeVisible();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: liveRecoveryLabel })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: openOfficialSourceLabel })
    ).toHaveAttribute("href", artwork.generatorUrl);
  });

  it("does not infer cross-origin readiness from the iframe load event", () => {
    const { container, liveFrame } = enterLiveMode();

    fireEvent.load(liveFrame);
    fireEvent.load(liveFrame);

    act(() => {
      jest.advanceTimersByTime(12_000);
    });
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: liveRecoveryLabel })
    ).toBeVisible();
  });

  it("falls back immediately when the live frame emits an error", () => {
    const { container, liveFrame } = enterLiveMode();

    fireEvent.error(liveFrame);

    expect(container.querySelector("iframe")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(liveErrorTitle);
    expect(jest.getTimerCount()).toBe(0);
    expect(
      screen.getByRole("link", { name: openOfficialSourceLabel })
    ).toHaveAttribute("href", artwork.generatorUrl);
  });

  it("removes the live frame and restores the still on request", () => {
    const { container } = enterLiveMode();

    fireEvent.click(screen.getByRole("button", { name: returnToStillLabel }));

    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(
      screen.getByRole("img", { name: artwork.visualDescription })
    ).toHaveAttribute("src", artwork.imageUrl);
    expect(screen.getByRole("button", { name: viewLiveLabel })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.queryByText(liveErrorTitle)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: openOfficialSourceLabel })
    ).toHaveAttribute("href", artwork.imageUrl);
  });

  it("cleans up the pending live timeout when unmounted", () => {
    const { unmount } = enterLiveMode();

    expect(jest.getTimerCount()).toBe(2);
    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });

  it("renders the CC license exactly once as a license link", () => {
    const { container } = render(<MuseumArtworkViewer artwork={artwork} />);
    const licenseLinks = container.querySelectorAll('a[rel~="license"]');

    expect(licenseLinks).toHaveLength(1);
    expect(licenseLinks[0]).toHaveAttribute("href", artwork.rightsUrl);
    expect(licenseLinks[0]).toHaveTextContent(artwork.rightsLabel);
  });
});
