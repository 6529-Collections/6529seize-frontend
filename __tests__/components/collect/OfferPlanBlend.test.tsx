import OfferPlanPanel from "@/components/collect/OfferPlanPanel";
import type {
  OfferPlanAnalysisInput,
  OfferPlanAnalysisView,
  OfferPlanReview,
} from "@/components/collect/collect-offer-plan.types";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import { parseEther } from "viem";
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
      .mockImplementation(async (input) =>
        offerAnalysis(
          input.rows.map((row) => ({
            ...offerPrice(
              Number(row.assetKey.split(":")[2]),
              row.pinned
                ? parseEther(row.unitPriceEth).toString()
                : "100000000000000000"
            ),
            quantity: row.quantity,
            references:
              input.controls.method === "match_bid"
                ? [
                    {
                      kind: "bid",
                      currency: "WETH",
                      amountWei: "100000000000000000",
                      observedAt: new Date().toISOString(),
                    },
                  ]
                : [],
          }))
        )
      ),
    onReviewOffer: jest.fn<void, [OfferPlanReview]>(),
    onReviewBuys: jest.fn<void, [readonly ApiCollectPlanLeg[]]>(),
    buyObservedAt: new Date().toISOString(),
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
const route = (id: number, name: "Collect now" | "Offer") =>
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

it("starts blend as offers and requires exact full-quantity listings before a Collect now choice", () => {
  render(<OfferPlanPanel {...props()} blended initialMethod="goal" />);
  expect(route(1, "Offer")).toHaveAttribute("aria-pressed", "true");
  expect(route(1, "Collect now")).toBeEnabled();
  expect(route(2, "Collect now")).toBeDisabled();
  expect(
    screen.getByText(
      "No priced listing combination for this full quantity in your chosen plan."
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: "Offer budget (WETH, optional)" })
  ).toHaveValue("");
  expect(screen.getByRole("radio", { name: "Base" })).toBeChecked();
  expect(
    screen.queryByRole("button", { name: "Price method" })
  ).not.toBeInTheDocument();
});

it("excludes buy NFTs from WETH allocation and returns exact purchase legs only on explicit review", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} blended initialMethod="goal" />);
  fireEvent.click(route(1, "Collect now"));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH, optional)" }),
    { target: { value: "0.15" } }
  );
  fireEvent.click(screen.getByRole("button", { name: "Refresh prices" }));
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
  expect(route(1, "Collect now")).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(review(2));
  expect(p.onReviewOffer).toHaveBeenCalledWith(
    expect.objectContaining({
      asset: offerAsset(2),
      maximumOfferAmountWei: "100000000000000000",
    })
  );
});

it.each(["Offer", "Collect now"] as const)(
  "preserves manual prices when the already selected %s route is clicked again",
  (selectedRoute) => {
    const p = props();
    render(<OfferPlanPanel {...p} blended initialMethod="manual" />);
    if (selectedRoute === "Collect now")
      fireEvent.click(route(1, selectedRoute));
    fireEvent.change(price(2), { target: { value: "0.125" } });
    expect(route(1, selectedRoute)).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(route(1, selectedRoute));
    expect(price(2)).toHaveValue("0.125");
    expect(review(2)).toBeDisabled();
    expect(p.analyze).not.toHaveBeenCalled();
    expect(p.onReviewOffer).not.toHaveBeenCalled();
  }
);

it("preserves generated prices and manual pins when the active Offer route is selected again", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} blended initialMethod="match_bid" />);
  fireEvent.click(screen.getByRole("radio", { name: "Conservative" }));
  fireEvent.change(price(2), { target: { value: "0.125" } });
  fireEvent.click(screen.getByRole("button", { name: "Refresh prices" }));
  await waitFor(() => expect(price(1)).toHaveValue("0.1"));
  fireEvent.click(route(1, "Offer"));
  expect(price(1)).toHaveValue("0.1");
  expect(price(2)).toHaveValue("0.125");
  expect(p.analyze).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Refresh prices" }));
  await waitFor(() => expect(p.analyze).toHaveBeenCalledTimes(4));
  expect(p.analyze).toHaveBeenLastCalledWith(
    expect.objectContaining({
      rows: expect.arrayContaining([
        expect.objectContaining({
          assetKey: offerAsset(2).asset_key,
          unitPriceEth: "0.125",
          pinned: true,
        }),
      ]),
    })
  );
});

it("never silently reuses calculated amounts after changing the buy/offer allocation", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} blended initialMethod="match_bid" />);
  fireEvent.click(screen.getByRole("radio", { name: "Conservative" }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh prices" }));
  await waitFor(() => expect(price(1)).toHaveValue("0.1"));
  fireEvent.change(price(2), { target: { value: "0.125" } });
  fireEvent.click(route(1, "Collect now"));
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

it("keeps pending and published offer NFTs unavailable for Collect now", () => {
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
  expect(route(1, "Collect now")).toBeDisabled();
  rerender(
    <OfferPlanPanel
      {...p}
      blended
      publishedOffers={[
        { assetKey: offerAsset(1).asset_key, amountWei: "100000000000000000" },
      ]}
    />
  );
  expect(route(1, "Collect now")).toBeDisabled();
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
  fireEvent.click(screen.getByRole("button", { name: "Refresh prices" }));
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

it("automatically applies Base and a changed tier while preserving edited per-NFT prices", async () => {
  const p = props();
  p.buyOptions[0]!.unit_price_wei = "120000000000000000";
  render(<OfferPlanPanel {...p} blended />);
  fireEvent.change(price(2), { target: { value: "0.125" } });
  await waitFor(() => expect(price(1)).toHaveValue("0.106666666666666666"));
  expect(review(1)).toBeEnabled();
  expect(p.analyze).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("radio", { name: "Aggressive" }));
  expect(review(1)).toBeDisabled();
  await waitFor(() =>
    expect(route(1, "Collect now")).toHaveAttribute("aria-pressed", "true")
  );
  expect(price(2)).toHaveValue("0.125");
  expect(p.analyze).toHaveBeenLastCalledWith(
    expect.objectContaining({
      controls: expect.objectContaining({ method: "manual" }),
      rows: [
        expect.objectContaining({
          assetKey: offerAsset(2).asset_key,
          pinned: true,
          unitPriceEth: "0.125",
        }),
      ],
    })
  );
  expect(p.onReviewOffer).not.toHaveBeenCalled();
  expect(p.onReviewBuys).not.toHaveBeenCalled();
});

it("clears review eligibility when refreshed automatic prices cannot pass funding analysis", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} blended />);
  await waitFor(() => expect(review(1)).toBeEnabled());
  const observed = await p.analyze.mock.results[0]!.value;
  p.analyze.mockImplementation(async (input) => {
    if (input.controls.method === "manual")
      throw new Error("funding unavailable");
    return observed;
  });
  fireEvent.click(screen.getByRole("radio", { name: "Conservative" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  expect(review(1)).toBeDisabled();
  expect(review(2)).toBeDisabled();
  fireEvent.click(review(1));
  expect(p.onReviewOffer).not.toHaveBeenCalled();
});

it.each(["missing", "wrong quantity"])(
  "retains both selected purchases and blocks a silent subset when one exact option is %s",
  async (failure) => {
    const p = props();
    const second = {
      ...p.buyOptions[0]!,
      candidate_id: "second",
      order_id: `0x${"2".repeat(64)}`,
      asset_key: offerAsset(2).asset_key,
    };
    p.buyOptions.push(second);
    const { rerender } = render(<OfferPlanPanel {...p} blended />);
    fireEvent.click(route(1, "Collect now"));
    fireEvent.click(route(2, "Collect now"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Review purchases (2)" })
      ).toBeEnabled()
    );
    rerender(
      <OfferPlanPanel
        {...p}
        blended
        buyOptions={
          failure === "missing"
            ? [p.buyOptions[0]!]
            : [p.buyOptions[0]!, { ...second, quantity: "2" }]
        }
      />
    );
    const reviewPurchases = screen.getByRole("button", {
      name: "Review purchases (1)",
    });
    expect(reviewPurchases).toBeDisabled();
    await waitFor(() => expect(p.analyze).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Refresh prices" })
      ).toBeEnabled()
    );
    expect(reviewPurchases).toBeDisabled();
    expect(route(2, "Collect now")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(reviewPurchases);
    expect(p.onReviewBuys).not.toHaveBeenCalled();
  }
);

it("discards old ask-derived funding after its source plan is cleared, before the next debounce", async () => {
  const p = props();
  const observed = offerAnalysis([
    { ...offerPrice(1), references: [] },
    { ...offerPrice(2), references: [] },
  ]);
  let resolveFunding!: (value: OfferPlanAnalysisView) => void;
  p.analyze.mockResolvedValueOnce(observed).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveFunding = resolve;
      })
  );
  const { rerender } = render(<OfferPlanPanel {...p} blended />);
  fireEvent.click(screen.getByRole("button", { name: "Refresh prices" }));
  await waitFor(() => expect(p.analyze).toHaveBeenCalledTimes(2));
  const manual = p.analyze.mock.calls[1]![0];
  rerender(
    <OfferPlanPanel {...p} blended buyOptions={[]} buyObservedAt={undefined} />
  );
  await act(async () => {
    resolveFunding(
      offerAnalysis(
        manual.rows.map((row) => ({
          ...offerPrice(
            Number(row.assetKey.split(":")[2]),
            parseEther(row.unitPriceEth).toString()
          ),
          quantity: row.quantity,
        }))
      )
    );
  });
  expect(price(1)).toHaveValue("");
  expect(review(1)).toBeDisabled();
  fireEvent.click(review(1));
  expect(p.onReviewOffer).not.toHaveBeenCalled();
});

it("checks the actual click time before reviewing purchases even before the expiry timer runs", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} blended />);
  fireEvent.click(route(1, "Collect now"));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Review purchases (1)" })
    ).toBeEnabled()
  );
  const clock = jest.spyOn(Date, "now").mockReturnValue(Date.now() + 120_000);
  try {
    fireEvent.click(
      screen.getByRole("button", { name: "Review purchases (1)" })
    );
    expect(p.onReviewBuys).not.toHaveBeenCalled();
  } finally {
    clock.mockRestore();
  }
});

it("accepts a fresh refresh result when the prior analysis expires while the refresh is pending", async () => {
  jest.useFakeTimers();
  const p = props();
  const { unmount } = render(<OfferPlanPanel {...p} blended buyOptions={[]} />);
  try {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(350);
    });
    expect(review(1)).toBeEnabled();
    expect(p.analyze).toHaveBeenCalledTimes(2);
    let resolveObserved!: (value: OfferPlanAnalysisView) => void;
    p.analyze.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveObserved = resolve;
        })
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh prices" }));
    expect(review(1)).toBeDisabled();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    expect(p.analyze).toHaveBeenCalledTimes(3);
    expect(p.onReviewOffer).not.toHaveBeenCalled();
    await act(async () => {
      resolveObserved(
        offerAnalysis(
          [1, 2].map((id) => ({
            ...offerPrice(id),
            references: [
              {
                kind: "bid",
                currency: "WETH",
                amountWei: "100000000000000000",
                observedAt: new Date().toISOString(),
              },
            ],
          }))
        )
      );
    });
    expect(p.analyze).toHaveBeenCalledTimes(4);
    expect(review(1)).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(p.onReviewOffer).not.toHaveBeenCalled();
    fireEvent.click(review(1));
    expect(p.onReviewOffer).toHaveBeenCalledTimes(1);
  } finally {
    unmount();
    jest.useRealTimers();
  }
});
