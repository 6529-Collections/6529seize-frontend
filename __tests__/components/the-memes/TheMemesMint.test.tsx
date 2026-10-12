import TheMemesMint from "@/components/the-memes/TheMemesMint";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

let mockPlatform: "ios" | "android" | "web" = "web";
let mockCountry: string | undefined = "US";
let mockIsCountryPending = false;
const mockReplace = jest.fn();
const mockSetTitle = jest.fn();
const mockManifoldMinting = jest.fn();
const mockUseDropForgeMintingConfig = jest.fn(() => ({
  contract: "0x123",
  chain: { id: 1 },
}));

jest.mock("next/dynamic", () => () => {
  return function MockManifoldMinting(props: {
    readonly animationSrc?: string | null;
  }) {
    mockManifoldMinting(props);
    return (
      <div data-testid="mint-artwork" data-animation-src={props.animationSrc} />
    );
  };
});

jest.mock("@/components/drop-forge/drop-forge-config", () => ({
  useDropForgeMintingConfig: () => mockUseDropForgeMintingConfig(),
}));

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({ setTitle: mockSetTitle }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({
    isIos: mockPlatform === "ios",
    isAndroid: mockPlatform === "android",
  }),
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({
    country: mockCountry,
    isCountryPending: mockIsCountryPending,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const nft = {
  id: 123,
  name: "First film",
  animation: "https://cdn.example/videos/123.MP4",
  compressed_animation: "https://cdn.example/scaledx750/123.MP4",
  metadata: { animation_url: "https://arweave.net/first-film" },
  mint_date: null,
} as ApiMemesExtendedData;

beforeEach(() => {
  jest.clearAllMocks();
  mockPlatform = "web";
  mockCountry = "US";
  mockIsCountryPending = false;
});

describe("TheMemesMint purchasing visibility", () => {
  it.each([
    ["non-US", "CY"],
    ["empty", ""],
    ["unknown", undefined],
  ])(
    "redirects restricted iOS with a %s country before mounting the mint flow",
    (_label, country) => {
      mockPlatform = "ios";
      mockCountry = country;

      const { container } = render(<TheMemesMint nft={nft} />);

      expect(container).toBeEmptyDOMElement();
      expect(mockReplace).toHaveBeenCalledWith("/the-memes");
      expect(mockManifoldMinting).not.toHaveBeenCalled();
      expect(mockUseDropForgeMintingConfig).not.toHaveBeenCalled();
      expect(mockSetTitle).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["US iOS", "ios", "US"],
    ["Android", "android", "CY"],
    ["web", "web", "CY"],
  ] as const)("keeps the mint flow on %s", (_label, platform, country) => {
    mockPlatform = platform;
    mockCountry = country;

    render(<TheMemesMint nft={nft} />);

    expect(screen.getByTestId("mint-artwork")).toBeInTheDocument();
    expect(mockUseDropForgeMintingConfig).toHaveBeenCalled();
    expect(mockSetTitle).toHaveBeenCalledWith(
      "Mint #123 | First film | The Memes"
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("holds a US iOS cold deep link until the country check returns US", () => {
    mockPlatform = "ios";
    mockCountry = "";
    mockIsCountryPending = true;

    const { container, rerender } = render(<TheMemesMint nft={nft} />);

    expect(container).toBeEmptyDOMElement();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockManifoldMinting).not.toHaveBeenCalled();
    expect(mockUseDropForgeMintingConfig).not.toHaveBeenCalled();

    mockCountry = "US";
    mockIsCountryPending = false;
    rerender(<TheMemesMint nft={nft} />);

    expect(screen.getByTestId("mint-artwork")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("omits the mint flow from server HTML before the platform is known", () => {
    mockPlatform = "ios";
    mockCountry = "CY";

    expect(renderToString(<TheMemesMint nft={nft} />)).toBe("");
    expect(mockManifoldMinting).not.toHaveBeenCalled();
    expect(mockUseDropForgeMintingConfig).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("TheMemesMint artwork", () => {
  it("passes each mint's API animation instead of its metadata or derivative", () => {
    const { rerender } = render(<TheMemesMint nft={nft} />);

    expect(screen.getByTestId("mint-artwork")).toHaveAttribute(
      "data-animation-src",
      nft.animation
    );

    const nextNft = {
      ...nft,
      id: 124,
      name: "Next film",
      animation: "https://cdn.example/videos/124.MP4",
    };
    rerender(<TheMemesMint nft={nextNft} />);

    expect(screen.getByTestId("mint-artwork")).toHaveAttribute(
      "data-animation-src",
      nextNft.animation
    );
  });
});
