import { GRADIENT_CONTRACT } from "@/constants/constants";

const mockGradientNFT = (overrides: Partial<any> = {}) => ({
  id: 1,
  contract: GRADIENT_CONTRACT,
  name: "Gradient #1",
  owner: "0x1234",
  owner_display: "TestOwner",
  boosted_tdh: 100,
  tdh_rank: 1,
  tdh__raw: 50,
  hodl_rate: 1.23,
  floor_price: 2,
  market_cap: 200,
  highest_offer: 1.5,
  mint_date: "2023-01-01",
  artist: "6529er",
  artist_seize_handle: "6529er",
  uri: "https://metadata.test/gradient/1",
  icon: "https://images.test/icon.png",
  thumbnail: "https://images.test/thumbnail.png",
  scaled: "https://images.test/scaled.png",
  image: "https://images.test/image.png",
  animation: "",
  ...overrides,
});

export const mockGradientCollection = (size = 10) =>
  Array.from({ length: size }, (_, i) =>
    mockGradientNFT({ id: i + 1, tdh_rank: i + 1 })
  );
