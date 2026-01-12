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
  mint_date: "2023-01-01",
  ...overrides,
});

export const mockGradientCollection = (size = 10) =>
  Array.from({ length: size }, (_, i) =>
    mockGradientNFT({ id: i + 1, tdh_rank: i + 1 })
  );
