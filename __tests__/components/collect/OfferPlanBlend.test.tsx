import OfferPlanPanel from "@/components/collect/OfferPlanPanel";
import type {
  OfferPlanAnalysisInput,
  OfferPlanAnalysisView,
  OfferPlanReview,
} from "@/components/collect/collect-offer-plan.types";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  offerAnalysis,
  offerAsset,
  offerPrice,
  OFFER_PAYER,
  OFFER_PROFILE,
} from "./offer-plan.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));

function props() {
  return {
    items: [1, 2].map((id) => ({ asset: offerAsset(id), quantity: "1" })),
    profile: OFFER_PROFILE,
    payingWallet: OFFER_PAYER,
    analyze: jest
      .fn<Promise<OfferPlanAnalysisView>, [OfferPlanAnalysisInput]>()
      .mockResolvedValue(offerAnalysis([offerPrice(2)])),
    onReviewOffer: jest.fn<void, [OfferPlanReview]>(),
    onReviewBuys: jest.fn<void, [readonly ApiCollectPlanLeg[]]>(),
    buyOptions: [
      {
        candidate_id: "listing",
        order_id: `0x${"1".repeat(64)}`,
        asset_key: offerAsset(1).asset_key,
        quantity: "1",
        unit_price_wei: "200000000000000000",
      },
    ],
  };
}
const route = (id: number, name: "Buy now" | "Offer") =>
  within(
    screen.getByRole("group", { name: `How to acquire Artwork ${id}` })
  ).getByRole("button", { name });
const price = (id: number) =>
  screen.getByRole("textbox", { name: `WETH price per NFT for Artwork ${id}` });
const review = (id: number) =>
  screen.getByRole("button", { name: `Review offer for Artwork ${id}` });
function chooseMethod(label: string) {
  fireEvent.click(screen.getByRole("button", { name: "Price method" }));
  fireEvent.click(screen.getByRole("option", { name: label }));
}

it("initializes the clicked method once, preserves edits on rerender, and applies only a new explicit session", () => {
  const p = props();
  const { rerender } = render(
    <OfferPlanPanel
      {...p}
      initialMethod="improve_bid"
      strategySessionKey="one"
    />
  );
  expect(
    screen.getByRole("button", { name: "Price method" })
  ).toHaveTextContent("Above observed WETH offer");
  fireEvent.change(price(1), { target: { value: "0.123" } });
  chooseMethod("Enter each price");
  rerender(
    <OfferPlanPanel
      {...p}
      initialMethod="discount_ask"
      strategySessionKey="one"
    />
  );
  expect(
    screen.getByRole("button", { name: "Price method" })
  ).toHaveTextContent("Enter each price");
  expect(price(1)).toHaveValue("0.123");
  rerender(
    <OfferPlanPanel
      {...p}
      initialMethod="discount_ask"
      strategySessionKey="two"
    />
  );
  expect(
    screen.getByRole("button", { name: "Price method" })
  ).toHaveTextContent("Below observed ask");
  expect(price(1)).toHaveValue("");
  expect(p.analyze).not.toHaveBeenCalled();
  expect(p.onReviewOffer).not.toHaveBeenCalled();
});

it("starts blend as offers and requires exact full-quantity listings before a Buy now choice", () => {
  render(<OfferPlanPanel {...props()} blended initialMethod="goal" />);
  expect(route(1, "Offer")).toHaveAttribute("aria-pressed", "true");
  expect(route(1, "Buy now")).toBeEnabled();
  expect(route(2, "Buy now")).toBeDisabled();
  expect(
    screen.getByText(
      "No priced listing combination for this full quantity in your chosen plan."
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" })
  ).toHaveValue("");
});

it("excludes buy NFTs from WETH allocation and returns exact purchase legs only on explicit review", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} blended initialMethod="goal" />);
  fireEvent.click(route(1, "Buy now"));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" }),
    { target: { value: "0.15" } }
  );
  fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
  await waitFor(() => expect(price(2)).toHaveValue("0.1"));
  expect(p.analyze).toHaveBeenCalledWith(
    expect.objectContaining({
      rows: [expect.objectContaining({ assetKey: offerAsset(2).asset_key })],
      controls: expect.objectContaining({ budgetEth: "0.15" }),
    })
  );
  expect(
    screen.queryByRole("button", { name: "Review offer for Artwork 1" })
  ).not.toBeInTheDocument();
  expect(screen.getByText("Purchase estimate: 0.2 ETH")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Gas is quoted at purchase review. The WETH offer budget is separate."
    )
  ).toBeInTheDocument();
  expect(review(2)).toBeEnabled();
  expect(p.onReviewBuys).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Review purchases (1)" }));
  expect(p.onReviewBuys).toHaveBeenCalledWith(p.buyOptions);
  expect(p.onReviewBuys.mock.calls[0]?.[0][0]).toBe(p.buyOptions[0]);
  expect(route(1, "Buy now")).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(review(2));
  expect(p.onReviewOffer).toHaveBeenCalledWith(
    expect.objectContaining({
      asset: offerAsset(2),
      maximumOfferAmountWei: "100000000000000000",
    })
  );
});

it("never silently reuses calculated amounts after changing the buy/offer allocation", async () => {
  const p = props();
  p.analyze.mockResolvedValue(offerAnalysis());
  render(<OfferPlanPanel {...p} blended initialMethod="match_bid" />);
  fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
  await waitFor(() => expect(price(1)).toHaveValue("0.1"));
  fireEvent.change(price(2), { target: { value: "0.125" } });
  fireEvent.click(route(1, "Buy now"));
  fireEvent.click(route(1, "Offer"));
  expect(price(1)).toHaveValue("");
  expect(price(2)).toHaveValue("0.125");
  expect(review(1)).toBeDisabled();
});

it("keeps a reserved purchase excluded after a preset reset and even on an offer-only workspace", () => {
  const p = props();
  const { rerender } = render(
    <OfferPlanPanel
      {...p}
      blended
      initialMethod="goal"
      buyLockedAssetKeys={[offerAsset(1).asset_key]}
      strategySessionKey="one"
    />
  );
  expect(route(1, "Offer")).toBeDisabled();
  expect(screen.getByText("Reserved for purchase review")).toBeInTheDocument();
  rerender(
    <OfferPlanPanel
      {...p}
      initialMethod="manual"
      buyLockedAssetKeys={[offerAsset(1).asset_key]}
      strategySessionKey="two"
    />
  );
  expect(
    screen.queryByRole("textbox", { name: "WETH price per NFT for Artwork 1" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Review offer for Artwork 1" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("checkbox", { name: "Select Artwork 1" })
  ).toBeDisabled();
});

it("keeps pending and published offer NFTs unavailable for Buy now", () => {
  const p = props();
  const { rerender } = render(
    <OfferPlanPanel
      {...p}
      blended
      pendingOffers={[
        {
          assetKey: offerAsset(1).asset_key,
          operationId: "operation",
          amountWei: "100000000000000000",
        },
      ]}
    />
  );
  expect(route(1, "Buy now")).toBeDisabled();
  rerender(
    <OfferPlanPanel
      {...p}
      blended
      publishedOffers={[
        { assetKey: offerAsset(1).asset_key, amountWei: "100000000000000000" },
      ]}
    />
  );
  expect(route(1, "Buy now")).toBeDisabled();
});

it("discards late allocation results after an external purchase reservation", async () => {
  const p = props();
  let resolve!: (value: OfferPlanAnalysisView) => void;
  p.analyze.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { rerender } = render(
    <OfferPlanPanel {...p} blended initialMethod="match_bid" />
  );
  fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
  rerender(
    <OfferPlanPanel
      {...p}
      blended
      initialMethod="match_bid"
      buyLockedAssetKeys={[offerAsset(1).asset_key]}
    />
  );
  await act(async () => {
    resolve(offerAnalysis());
  });
  expect(price(2)).toHaveValue("");
  expect(
    screen.queryByRole("textbox", { name: "WETH price per NFT for Artwork 1" })
  ).not.toBeInTheDocument();
  expect(p.onReviewOffer).not.toHaveBeenCalled();
});
