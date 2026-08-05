import { render, screen } from "@testing-library/react";
import React from "react";
import NextGenCollectionHeader, {
  NextGenBackToCollectionPageLink,
} from "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader";
import { fetchUrl } from "@/services/6529api";

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(() => Promise.resolve({})),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: "US",
    consent: jest.fn(),
    reject: jest.fn(),
  })),
}));

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => window.location.pathname),
}));

// Mock WagmiProvider and related hooks
jest.mock("wagmi", () => ({
  useReadContract: jest.fn(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
  })),
  useConfig: jest.fn(() => ({})),
}));

const collection: any = {
  id: 1,
  name: "My Collection",
  artist: "Artist",
  artist_address: "artist",
  mint_count: 0,
  total_supply: 10,
  allowlist_start: Math.floor(Date.now() / 1000) + 3600,
  allowlist_end: Math.floor(Date.now() / 1000) + 7200,
  public_start: Math.floor(Date.now() / 1000) + 10000,
  public_end: Math.floor(Date.now() / 1000) + 20000,
  image: "",
  banner: "",
  distribution_plan: "",
  website: "",
  licence: "",
  base_uri: "",
  library: "",
  dependency_script: "",
  artist_signature: "",
  final_supply_after_mint: 10,
  on_chain: false,
  merkle_root: "root",
  opensea_link: "",
  description: "",
};

describe("NextGenCollectionHeader", () => {
  it("renders back link text depending on path", () => {
    window.history.pushState({}, "", "/x/art");
    render(<NextGenBackToCollectionPageLink collection={collection} />);
    expect(
      screen.getByRole("link", { name: "Back to collection page" })
    ).toHaveAttribute("href", "/nextgen/collection/my-collection");
  });

  it("links collection overview pages back to their art view", () => {
    window.history.pushState({}, "", "/nextgen/collection/my-collection/about");
    render(<NextGenBackToCollectionPageLink collection={collection} />);

    expect(
      screen.getByRole("link", { name: "Back to collection art" })
    ).toHaveAttribute("href", "/nextgen/collection/my-collection/art");
  });

  it("shows countdown when mint window approaching", () => {
    render(
      <NextGenCollectionHeader
        collection={collection}
        show_links={false}
        collection_link={false}
      />
    );
    expect(screen.getByText(collection.name)).toBeInTheDocument();
    // countdown from allowlist_start should render
    expect(screen.getByText(/Allowlist Starting/)).toBeInTheDocument();
  });

  it("names the mint link while its details are loading", () => {
    (fetchUrl as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(
      <NextGenCollectionHeader
        collection={collection}
        show_links
        collection_link={false}
      />
    );

    expect(
      screen.getByRole("link", { name: "Loading mint details" })
    ).toBeInTheDocument();
  });
});
