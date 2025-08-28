import { render, screen } from "@testing-library/react";
import React from "react";
import NextGenTokenPageClient from "@/app/nextgen/token/[token]/[[...view]]/NextGenTokenPageClient";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { NextGenCollection, NextGenToken } from "@/entities/INextgen";

// Mock next/navigation (App Router)
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
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
}));

// Mock NextGenNavigationHeader
jest.mock(
  "@/components/nextGen/collections/NextGenNavigationHeader",
  () => () => <div data-testid="navigation-header" />
);

// Mock NextGenTokenComponent
jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenToken",
  () => (props: {
    token: NextGenToken;
    collection: NextGenCollection;
    view: ContentView;
    tokenCount: number;
    traits: any[];
    setView: any;
  }) => (
    <div data-testid="nextgen-token-component">
      <div data-testid="token-name">{props.token.name}</div>
      <div data-testid="collection-name">{props.collection.name}</div>
      <div data-testid="view">{props.view}</div>
      <div data-testid="token-count">{props.tokenCount}</div>
    </div>
  )
);

// Mock NextGenTokenOnChain
jest.mock(
  "@/components/nextGen/collections/NextGenTokenOnChain",
  () => (props: {
    collection: NextGenCollection;
    token_id: number;
  }) => (
    <div data-testid="nextgen-token-onchain">
      <div data-testid="onchain-token-id">{props.token_id}</div>
      <div data-testid="onchain-collection-name">{props.collection.name}</div>
    </div>
  )
);

const mockCollection: NextGenCollection = {
  id: 1,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  name: "Test Collection",
  artist: "Test Artist",
  description: "Test Description",
  website: "https://test.com",
  licence: "Test License",
  base_uri: "https://api.test.com/",
  library: "Test Library",
  dependency_script: "",
  image: "https://test.com/image.png",
  banner: "https://test.com/banner.png",
  distribution_plan: "Test Distribution Plan",
  artist_address: "0x123",
  artist_signature: "0x456",
  max_purchases: 10,
  total_supply: 1000,
  final_supply_after_mint: 1000,
  mint_count: 500,
  on_chain: true,
  allowlist_start: Math.floor(Date.now() / 1000),
  allowlist_end: Math.floor(Date.now() / 1000) + 3600,
  public_start: Math.floor(Date.now() / 1000) + 7200,
  public_end: Math.floor(Date.now() / 1000) + 86400,
  merkle_root: "0x789",
  opensea_link: "https://opensea.io/collection/test",
};

const mockToken: NextGenToken = {
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  id: 123,
  normalised_id: 123,
  name: "Test Token",
  collection_id: 1,
  collection_name: "Test Collection",
  mint_date: new Date("2024-01-01T00:00:00.000Z"),
  mint_price: 0.1,
  metadata_url: "https://test.com/metadata.json",
  image_url: "https://test.com/image.png",
  thumbnail_url: "https://test.com/thumbnail.png",
  animation_url: "",
  owner: "0xTestOwner",
  pending: false,
  burnt: false,
  hodl_rate: 0.5,
  mint_data: "{}",
  rarity_score: 10.5,
  rarity_score_rank: 1,
  rarity_score_normalised: 0.95,
  rarity_score_normalised_rank: 1,
  rarity_score_trait_count: 5,
  rarity_score_trait_count_rank: 1,
  rarity_score_trait_count_normalised: 0.95,
  rarity_score_trait_count_normalised_rank: 1,
  statistical_score: 9.5,
  statistical_score_rank: 2,
  statistical_score_normalised: 0.90,
  statistical_score_normalised_rank: 2,
  statistical_score_trait_count: 4,
  statistical_score_trait_count_rank: 2,
  statistical_score_trait_count_normalised: 0.90,
  statistical_score_trait_count_normalised_rank: 2,
  single_trait_rarity_score: 8.5,
  single_trait_rarity_score_rank: 3,
  single_trait_rarity_score_normalised: 0.85,
  single_trait_rarity_score_normalised_rank: 3,
  single_trait_rarity_score_trait_count: 3,
  single_trait_rarity_score_trait_count_rank: 3,
  single_trait_rarity_score_trait_count_normalised: 0.85,
  single_trait_rarity_score_trait_count_normalised_rank: 3,
  price: 1.5,
  opensea_price: 1.4,
  opensea_royalty: 0.05,
  blur_price: 1.3,
  me_price: 1.35,
  me_royalty: 0.025,
  last_sale_value: 1.2,
  last_sale_date: new Date("2023-12-01T00:00:00.000Z"),
  max_sale_value: 2.0,
  max_sale_date: new Date("2023-11-01T00:00:00.000Z"),
  normalised_handle: "testuser",
  handle: "TestUser",
  level: 5,
  tdh: 100,
  rep_score: 500,
};

const mockTokenPageProps = {
  tokenId: 123,
  token: mockToken,
  traits: [],
  tokenCount: 100,
  collection: mockCollection,
  view: ContentView.ABOUT,
};

describe("NextGen App Router Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("NextGenTokenPageClient", () => {
    it("renders NextGen Token page with token", () => {
      render(<NextGenTokenPageClient {...mockTokenPageProps} />);
      
      expect(screen.getByTestId("navigation-header")).toBeInTheDocument();
      expect(screen.getByTestId("nextgen-token-component")).toBeInTheDocument();
      expect(screen.getByTestId("token-count")).toHaveTextContent("100");
      expect(screen.getByTestId("token-name")).toHaveTextContent("Test Token");
      expect(screen.getByTestId("collection-name")).toHaveTextContent("Test Collection");
      expect(screen.getByTestId("view")).toHaveTextContent(ContentView.ABOUT);
    });

    it("renders NextGen Token page without token (on-chain)", () => {
      const propsWithoutToken = {
        ...mockTokenPageProps,
        token: null,
      };
      render(<NextGenTokenPageClient {...propsWithoutToken} />);
      
      expect(screen.getByTestId("navigation-header")).toBeInTheDocument();
      expect(screen.getByTestId("nextgen-token-onchain")).toBeInTheDocument();
      expect(screen.getByTestId("onchain-token-id")).toHaveTextContent("123");
      expect(screen.getByTestId("onchain-collection-name")).toHaveTextContent("Test Collection");
    });

    it("sets title correctly on mount with token", () => {
      render(<NextGenTokenPageClient {...mockTokenPageProps} />);
      
      expect(mockSetTitle).toHaveBeenCalledWith("Test Token");
    });

    it("sets title correctly on mount without token", () => {
      const propsWithoutToken = {
        ...mockTokenPageProps,
        token: null,
      };
      render(<NextGenTokenPageClient {...propsWithoutToken} />);
      
      expect(mockSetTitle).toHaveBeenCalledWith("Test Collection - #123");
    });

    it("sets title with view when view is not ABOUT", () => {
      const propsWithView = {
        ...mockTokenPageProps,
        view: ContentView.OVERVIEW,
      };
      render(<NextGenTokenPageClient {...propsWithView} />);
      
      expect(mockSetTitle).toHaveBeenCalledWith("Test Token | Overview");
    });
  });
});
