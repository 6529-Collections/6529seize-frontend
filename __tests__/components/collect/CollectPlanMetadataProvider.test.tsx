import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import CollectPlanMetadataProvider from "@/components/collect/CollectPlanMetadataProvider";
import OfferPlanPanel from "@/components/collect/OfferPlanPanel";
import { fetchCollectAssets } from "@/services/api/collect-api";
import type { ApiCollectAssetsPage } from "@/generated/models/ApiCollectAssetsPage";
import {
  offerAsset,
  offerAnalysis,
  OFFER_PAYER,
  OFFER_PROFILE,
} from "./offer-plan.fixture";

jest.mock("@/services/api/collect-api", () => ({
  fetchCollectAssets: jest.fn(),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => (
    <span role="img" aria-label={name} />
  ),
}));

test("late canonical artwork metadata supplies thumbnail, artist and token without resetting an edited offer", async () => {
  const asset = {
    ...offerAsset(1),
    image_url: "https://example.com/artwork.png",
    artist_ids: ["artist"],
  };
  let complete!: (page: ApiCollectAssetsPage) => void;
  jest.mocked(fetchCollectAssets).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const analyze = jest.fn().mockResolvedValue(offerAnalysis());
  const onReviewOffer = jest.fn();
  const view = render(
    <QueryClientProvider client={client}>
      <CollectPlanMetadataProvider
        assetKeys={[asset.asset_key]}
        knownAssets={[]}
        catalog={{
          version: "v1",
          chain_id: 1,
          seasons: [],
          pebbles_traits: [],
          tdh_snapshot: null,
          artists: [
            {
              id: "artist",
              name: "Artist Name",
              asset_keys: [asset.asset_key],
              collaboration_asset_keys: [],
            },
          ],
        }}
      >
        <OfferPlanPanel
          items={[{ assetKey: asset.asset_key, quantity: "1" }]}
          profile={OFFER_PROFILE}
          payingWallet={OFFER_PAYER}
          analyze={analyze}
          onReviewOffer={onReviewOffer}
        />
      </CollectPlanMetadataProvider>
    </QueryClientProvider>
  );
  await waitFor(() => expect(fetchCollectAssets).toHaveBeenCalledTimes(1));
  fireEvent.change(
    screen.getByRole("textbox", { name: "WETH price per NFT for NFT #1" }),
    { target: { value: "0.25" } }
  );
  await act(async () => {
    complete({
      count: 1,
      page: 1,
      next: false,
      catalog_version: "v1",
      data: [asset],
    });
  });
  expect(
    await screen.findByRole("textbox", {
      name: "WETH price per NFT for Artwork 1",
    })
  ).toHaveValue("0.25");
  expect(screen.getByRole("img", { name: "Artwork 1" })).toBeVisible();
  expect(screen.getByText("Artist Name")).toBeVisible();
  expect(screen.getByText("The Memes · #1")).toBeVisible();
  expect(analyze).not.toHaveBeenCalled();
  expect(onReviewOffer).not.toHaveBeenCalled();
  view.unmount();
  client.clear();
});
