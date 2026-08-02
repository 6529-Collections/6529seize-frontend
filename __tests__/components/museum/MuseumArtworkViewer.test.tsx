import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
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
  }: MockNextImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} {...props} />
  ),
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
  imageUrl: "https://media-proxy.artblocks.io/example/still.png",
  generatorUrl: "https://generator.artblocks.io/example/live",
  visualDescription: "A governed visual description of the artwork.",
  observedImageSha256:
    "sha256:2769e41b8ea77a39b53103e31e1eaa52c04031c400062d309f7bf547792ba5da",
  creditLine: "Gift of punk6529.",
  rightsLabel: "CC BY-NC 4.0",
  rightsUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
  status: "accessioned",
  mediaRetention: "upstream_not_retained",
};

describe("MuseumArtworkViewer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("times out the single sandboxed live frame and returns to the still", () => {
    const { container } = render(<MuseumArtworkViewer artwork={artwork} />);
    const still = screen.getByRole("img", {
      name: artwork.visualDescription,
    });

    fireEvent.load(still);
    fireEvent.click(screen.getByRole("button", { name: "View live work" }));

    const liveFrames = container.querySelectorAll("iframe");
    expect(liveFrames).toHaveLength(1);
    expect(liveFrames[0]).toHaveAttribute("sandbox", "allow-scripts");
    expect(liveFrames[0]).toHaveAttribute("src", artwork.generatorUrl);

    act(() => {
      jest.advanceTimersByTime(11_999);
    });
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(
      screen.queryByText("The live presentation did not load.")
    ).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(
      screen.getByText("The live presentation did not load.")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Return to still image" })
    );

    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(
      screen.getByRole("img", { name: artwork.visualDescription })
    ).toHaveAttribute("src", artwork.imageUrl);
    expect(
      screen.getByRole("button", { name: "View live work" })
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByText("The live presentation did not load.")
    ).not.toBeInTheDocument();
  });

  it("renders the CC license exactly once as a license link", () => {
    const { container } = render(<MuseumArtworkViewer artwork={artwork} />);
    const licenseLinks = container.querySelectorAll('a[rel~="license"]');

    expect(licenseLinks).toHaveLength(1);
    expect(licenseLinks[0]).toHaveAttribute("href", artwork.rightsUrl);
    expect(licenseLinks[0]).toHaveTextContent(artwork.rightsLabel);
  });
});
