import { fetchInitialTokens } from "@/components/nextGen/collections/collectionParts/hooks/fetchInitialTokens";
import type { NextGenToken } from "@/entities/INextgen";
import * as commonApiModule from "@/services/api/common-api";

const mockCommonApiFetch = jest.spyOn(commonApiModule, "commonApiFetch");

const baseToken: NextGenToken = {
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  id: 1,
  normalised_id: 1,
  name: "Example",
  collection_id: 42,
  collection_name: "Example Collection",
  mint_date: new Date("2024-01-01T00:00:00Z"),
  mint_price: 1,
  metadata_url: "https://example.com/metadata",
  image_url: "https://example.com/image",
  icon_url: "https://example.com/icon",
  thumbnail_url: "https://example.com/thumb",
  animation_url: "https://example.com/animation",
  generator: undefined,
  owner: "0x0000000000000000000000000000000000000001",
  pending: false,
  burnt: false,
  burnt_date: undefined,
  hodl_rate: 0,
  mint_data: "",
  rarity_score: 0,
  rarity_score_rank: 0,
  rarity_score_normalised: 0,
  rarity_score_normalised_rank: 0,
  rarity_score_trait_count: 0,
  rarity_score_trait_count_rank: 0,
  rarity_score_trait_count_normalised: 0,
  rarity_score_trait_count_normalised_rank: 0,
  statistical_score: 0,
  statistical_score_rank: 0,
  statistical_score_normalised: 0,
  statistical_score_normalised_rank: 0,
  statistical_score_trait_count: 0,
  statistical_score_trait_count_rank: 0,
  statistical_score_trait_count_normalised: 0,
  statistical_score_trait_count_normalised_rank: 0,
  single_trait_rarity_score: 0,
  single_trait_rarity_score_rank: 0,
  single_trait_rarity_score_normalised: 0,
  single_trait_rarity_score_normalised_rank: 0,
  single_trait_rarity_score_trait_count: 0,
  single_trait_rarity_score_trait_count_rank: 0,
  single_trait_rarity_score_trait_count_normalised: 0,
  single_trait_rarity_score_trait_count_normalised_rank: 0,
  price: 0,
  opensea_price: 0,
  opensea_royalty: 0,
  blur_price: 0,
  me_price: 0,
  me_royalty: 0,
  last_sale_value: 0,
  last_sale_date: new Date("2024-01-01T00:00:00Z"),
  max_sale_value: 0,
  max_sale_date: new Date("2024-01-01T00:00:00Z"),
  normalised_handle: "example",
  handle: "example",
  level: 1,
  tdh: 0,
  rep_score: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCommonApiFetch.mockReset();
});

afterAll(() => {
  mockCommonApiFetch.mockRestore();
});

describe("fetchInitialTokens", () => {
  it("requests the first page with fixed query parameters", async () => {
    const tokens = [{ ...baseToken, id: 2 }];
    mockCommonApiFetch.mockResolvedValue({
      count: 1,
      page: 1,
      next: null,
      data: tokens,
    });

    const result = await fetchInitialTokens(123);

    expect(result).toEqual(tokens);
    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint:
        "nextgen/collections/123/tokens?page_size=50&page=1&sort=random",
    });
  });

  it("returns an empty array when API returns no data", async () => {
    mockCommonApiFetch.mockResolvedValue({
      count: 0,
      page: 1,
      next: null,
      data: [],
    });

    const result = await fetchInitialTokens(999);

    expect(result).toEqual([]);
  });

  it("logs and returns an empty array when the request fails", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("network");
    mockCommonApiFetch.mockRejectedValue(error);

    const result = await fetchInitialTokens(7);

    expect(log).toHaveBeenCalledWith("Failed to fetch initial tokens:", error);
    expect(result).toEqual([]);

    log.mockRestore();
  });
});
