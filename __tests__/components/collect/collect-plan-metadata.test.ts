import {
  loadCollectPlanMetadata,
  matchingCollectAsset,
} from "@/components/collect/collect-plan-metadata";
import { fetchCollectAssets } from "@/services/api/collect-api";
import { offerAsset } from "./offer-plan.fixture";

jest.mock("@/services/api/collect-api", () => ({
  fetchCollectAssets: jest.fn(),
}));
const fetchAssets = jest.mocked(fetchCollectAssets);
beforeEach(() => fetchAssets.mockReset());

test("uses exact identity rather than the first token-search match", async () => {
  const wanted = offerAsset(1),
    unrelated = offerAsset(10);
  fetchAssets.mockResolvedValue({
    count: 2,
    page: 1,
    next: false,
    catalog_version: "v1",
    data: [unrelated, wanted],
  });
  await expect(
    loadCollectPlanMetadata([wanted.asset_key], new AbortController().signal)
  ).resolves.toEqual([wanted]);
  expect(fetchAssets).toHaveBeenCalledTimes(1);
  expect(
    matchingCollectAsset(wanted.asset_key, { ...wanted, token_id: "10" })
  ).toBeUndefined();
  expect(
    matchingCollectAsset(wanted.asset_key, { ...wanted, chain_id: 2 })
  ).toBeUndefined();
});

test("uses paginated family reads for a larger exact set rather than a request per NFT", async () => {
  const assets = Array.from({ length: 30 }, (_, index) =>
    offerAsset(index + 1)
  );
  fetchAssets.mockImplementation(async ({ page }) => ({
    count: assets.length,
    page,
    next: page === 1,
    catalog_version: "v1",
    data: page === 1 ? assets.slice(0, 24) : assets.slice(24),
  }));
  const result = await loadCollectPlanMetadata(
    assets.map((asset) => asset.asset_key),
    new AbortController().signal
  );
  expect(result).toEqual(assets);
  expect(fetchAssets).toHaveBeenCalledTimes(2);
  expect(
    fetchAssets.mock.calls.every(([request]) => request.query === "")
  ).toBe(true);
});

test("stops before metadata requests when the request is aborted", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    loadCollectPlanMetadata([offerAsset(1).asset_key], controller.signal)
  ).rejects.toBeDefined();
  expect(fetchAssets).not.toHaveBeenCalled();
});
