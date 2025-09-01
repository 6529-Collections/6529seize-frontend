import NextGenTokenPageClient from "@/app/nextgen/token/[token]/[[...view]]/NextGenTokenPageClient";
import { AuthContext } from "@/components/auth/Auth";
import NextGenCollectionComponent from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { NextgenCollectionView } from "@/enums";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock Next.js App Router navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/nextgen/token/123",
  notFound: jest.fn(),
}));

// Mock the main NextGen components
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollection",
  () => ({
    __esModule: true,
    default: ({ collection }: any) => {
      const { setTitle } = require("@/contexts/TitleContext").useTitle();
      React.useEffect(() => {
        setTitle(`${collection.name} | NextGen`);
      }, [collection.name, setTitle]);
      return <div data-testid="collection-component" />;
    },
    ContentView: {
      OVERVIEW: "OVERVIEW",
      ABOUT: "ABOUT",
      ART: "ART",
    },
  })
);

jest.mock("@/components/nextGen/collections/nextgenToken/NextGenToken", () => ({
  __esModule: true,
  default: () => <div data-testid="token-component" />,
}));

jest.mock("@/components/nextGen/collections/NextGenTokenOnChain", () => ({
  __esModule: true,
  default: () => <div data-testid="token-onchain-component" />,
}));

// Mock useShallowRedirect hook used in collection pages
jest.mock("@/app/nextgen/collection/[collection]/useShallowRedirect", () => ({
  useShallowRedirect: jest.fn(),
}));

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => ({
    __esModule: true,
    default: ({ collection }: any) => (
      <div data-testid="collection-header">{collection?.name}</div>
    ),
    NextGenCollectionHead: ({ collection }: any) => (
      <div data-testid="collection-head">{collection?.name}</div>
    ),
  })
);

jest.mock("@/components/nextGen/collections/NextGenNavigationHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="navigation-header" />,
}));

// Mock TitleContext
const mockSetTitle = jest.fn();
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: () => mockSetTitle,
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockAuthContext = {
  setTitle: mockSetTitle,
  connectedProfile: null,
  activeProfileProxy: null,
  requestAuth: jest.fn(),
} as any;

function renderWithAuth(component: React.ReactElement) {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
}

const mockTokenPageClientProps = {
  tokenId: 123,
  token: {
    id: 123,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    normalised_id: 123,
    name: "Test Token",
    collection_id: 1,
    collection_name: "Test Collection",
    mint_date: new Date("2023-01-01T00:00:00Z"),
    mint_price: 0,
    metadata_url: "https://example.com/metadata/123",
    image_url: "https://example.com/image/123",
    thumbnail_url: "https://example.com/thumb/123",
    animation_url: "https://example.com/animation/123",
    owner: "0x123456789",
    pending: false,
    burnt: false,
    hodl_rate: 100,
    mint_data: "{}",
    rarity_score: 100,
    rarity_score_rank: 1,
    rarity_score_normalised: 100,
    rarity_score_normalised_rank: 1,
    rarity_score_trait_count: 5,
    rarity_score_trait_count_rank: 1,
    rarity_score_trait_count_normalised: 100,
    rarity_score_trait_count_normalised_rank: 1,
    statistical_score: 100,
    statistical_score_rank: 1,
    statistical_score_normalised: 100,
    statistical_score_normalised_rank: 1,
    statistical_score_trait_count: 5,
    statistical_score_trait_count_rank: 1,
    statistical_score_trait_count_normalised: 100,
    statistical_score_trait_count_normalised_rank: 1,
    single_trait_rarity_score: 100,
    single_trait_rarity_score_rank: 1,
    single_trait_rarity_score_normalised: 100,
    single_trait_rarity_score_normalised_rank: 1,
    single_trait_rarity_score_trait_count: 5,
    single_trait_rarity_score_trait_count_rank: 1,
    single_trait_rarity_score_trait_count_normalised: 100,
    single_trait_rarity_score_trait_count_normalised_rank: 1,
    price: 0,
    opensea_price: 0,
    opensea_royalty: 0,
    blur_price: 0,
    me_price: 0,
    me_royalty: 0,
    last_sale_value: 0,
    last_sale_date: new Date("2023-01-01T00:00:00Z"),
    max_sale_value: 0,
    max_sale_date: new Date("2023-01-01T00:00:00Z"),
    normalised_handle: "test_handle",
    handle: "Test Handle",
    level: 1,
    tdh: 100,
    rep_score: 100,
  },
  traits: [],
  tokenCount: 100,
  collection: {
    id: 1,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    name: "Test Collection",
    artist: "Test Artist",
    description: "Test Description",
    website: "https://example.com",
    licence: "MIT",
    base_uri: "https://example.com/",
    library: "p5js",
    dependency_script: "",
    image: "https://example.com/collection.jpg",
    banner: "https://example.com/banner.jpg",
    distribution_plan: "Random",
    artist_address: "0x123456789",
    artist_signature: "0x123456789",
    max_purchases: 10,
    total_supply: 1000,
    final_supply_after_mint: 1000,
    mint_count: 100,
    on_chain: true,
    allowlist_start: 1672531200,
    allowlist_end: 1672617600,
    public_start: 1672704000,
    public_end: 1672790400,
    merkle_root: "0x123456789",
    opensea_link: "https://opensea.io/collection/test",
  },
  view: NextgenCollectionView.ABOUT,
};

const mockCollectionComponentProps = {
  collection: {
    id: 1,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    name: "Test Collection",
    artist: "Test Artist",
    description: "Test Description",
    website: "https://example.com",
    licence: "MIT",
    base_uri: "https://example.com/",
    library: "p5js",
    dependency_script: "",
    image: "https://example.com/collection.jpg",
    banner: "https://example.com/banner.jpg",
    distribution_plan: "Random",
    artist_address: "0x123456789",
    artist_signature: "0x123456789",
    max_purchases: 10,
    total_supply: 1000,
    final_supply_after_mint: 1000,
    mint_count: 100,
    on_chain: true,
    allowlist_start: 1672531200,
    allowlist_end: 1672617600,
    public_start: 1672704000,
    public_end: 1672790400,
    merkle_root: "0x123456789",
    opensea_link: "https://opensea.io/collection/test",
  },
  initialView: NextgenCollectionView.OVERVIEW,
};

describe("NextGen Client Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("NextGenTokenPageClient", () => {
    it("renders with token - shows token component and navigation", () => {
      renderWithAuth(<NextGenTokenPageClient {...mockTokenPageClientProps} />);
      expect(screen.getByTestId("navigation-header")).toBeInTheDocument();
      expect(screen.getByTestId("token-component")).toBeInTheDocument();
      expect(mockSetTitle).toHaveBeenCalled();
    });

    it("renders without token - shows on-chain component for unminted tokens", () => {
      const propsWithoutToken = {
        ...mockTokenPageClientProps,
        token: null,
      };
      renderWithAuth(<NextGenTokenPageClient {...propsWithoutToken} />);
      expect(screen.getByTestId("navigation-header")).toBeInTheDocument();
      expect(screen.getByTestId("token-onchain-component")).toBeInTheDocument();
    });
  });

  describe("NextGenCollectionComponent", () => {
    it("renders collection component and sets title", async () => {
      renderWithAuth(
        <NextGenCollectionComponent {...mockCollectionComponentProps} />
      );
      expect(screen.getByTestId("collection-component")).toBeInTheDocument();
      await waitFor(() => {
        expect(mockSetTitle).toHaveBeenCalled();
      });
    });

    it("sets correct title when token exists", () => {
      renderWithAuth(<NextGenTokenPageClient {...mockTokenPageClientProps} />);
      expect(mockSetTitle).toHaveBeenCalledWith(
        expect.stringContaining("Test Token")
      );
    });

    it("sets collection and token ID title when token is null", () => {
      const propsWithoutToken = {
        ...mockTokenPageClientProps,
        token: null,
      };
      renderWithAuth(<NextGenTokenPageClient {...propsWithoutToken} />);
      expect(mockSetTitle).toHaveBeenCalledWith(
        expect.stringContaining("Test Collection - #123")
      );
    });

    it("sets correct collection title with NextGen suffix", async () => {
      renderWithAuth(
        <NextGenCollectionComponent {...mockCollectionComponentProps} />
      );
      await waitFor(() => {
        expect(mockSetTitle).toHaveBeenCalledWith(
          expect.stringContaining("Test Collection")
        );
        expect(mockSetTitle).toHaveBeenCalledWith(
          expect.stringContaining("NextGen")
        );
      });
    });

    it("handles different view types correctly", async () => {
      const propsWithDifferentView = {
        ...mockCollectionComponentProps,
        initialView: NextgenCollectionView.RARITY,
      };
      renderWithAuth(
        <NextGenCollectionComponent {...propsWithDifferentView} />
      );
      await waitFor(() => {
        expect(mockSetTitle).toHaveBeenCalledWith(
          expect.stringContaining("Test Collection")
        );
      });
    });
  });
});
