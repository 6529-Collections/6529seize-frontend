import OfferPlanPanel from "@/components/collect/OfferPlanPanel";
import type {
  OfferPlanAnalysisInput,
  OfferPlanAnalysisView,
  OfferPlanReview,
} from "@/components/collect/collect-offer-plan.types";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
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
      .mockResolvedValue(offerAnalysis()),
    onReviewOffer: jest.fn<void, [OfferPlanReview]>(),
  };
}
const priceInput = (id: number) =>
  screen.getByRole("textbox", { name: `WETH price per NFT for Artwork ${id}` });
const reviewButton = (id: number) =>
  screen.getByRole("button", { name: `Review offer for Artwork ${id}` });
function setPrice(id: number, value: string) {
  fireEvent.change(priceInput(id), { target: { value } });
}
function setMethod(value: string) {
  const labels: Record<string, string> = {
    manual: "Enter each price",
    match_bid: "Match observed WETH offer",
    improve_bid: "Above observed WETH offer",
    discount_ask: "Below observed ask",
    goal: "Conservative allocation",
  };
  fireEvent.click(screen.getByRole("button", { name: "Price method" }));
  fireEvent.click(screen.getByRole("option", { name: labels[value] ?? value }));
}

it("requires each manual price and never substitutes a total budget or automatic signature", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} />);
  expect(
    screen.queryByRole("textbox", { name: "Offer budget (WETH)" })
  ).not.toBeInTheDocument();
  expect(screen.getByText("Prices needed: 2")).toBeInTheDocument();
  setPrice(1, "0.1");
  expect(screen.getByText("Prices needed: 1")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Check amounts and WETH" })
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "every selected NFT"
  );
  expect(p.analyze).not.toHaveBeenCalled();
  setPrice(2, "0.2");
  fireEvent.click(
    screen.getByRole("button", { name: "Check amounts and WETH" })
  );
  await waitFor(() => expect(p.analyze).toHaveBeenCalledTimes(1));
  expect(p.onReviewOffer).not.toHaveBeenCalled();
  fireEvent.click(reviewButton(2));
  expect(p.onReviewOffer).toHaveBeenCalledWith(
    expect.objectContaining({
      asset: offerAsset(2),
      unitPriceEth: "0.2",
      quantity: "1",
      expiryHours: "168",
    })
  );
});
it("preserves manual pins when a formula runs and leaves missing references unresolved", async () => {
  const p = props();
  p.analyze.mockResolvedValue(
    offerAnalysis([offerPrice(1), offerPrice(2, null)])
  );
  render(<OfferPlanPanel {...p} />);
  setPrice(1, "0.25");
  setMethod("match_bid");
  fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
  await waitFor(() =>
    expect(
      screen.getByText("No usable WETH offer reference. Enter a price.")
    ).toBeInTheDocument()
  );
  expect(priceInput(1)).toHaveValue("0.25");
  expect(priceInput(2)).toHaveValue("");
  expect(reviewButton(2)).toBeDisabled();
  expect(p.onReviewOffer).not.toHaveBeenCalled();
});
it("bounds visible inputs while keeping full-set selection and search", () => {
  const p = {
    ...props(),
    items: Array.from({ length: 546 }, (_, id) => ({
      asset: offerAsset(id + 1),
      quantity: "1",
    })),
  };
  render(<OfferPlanPanel {...p} />);
  expect(screen.getAllByRole("checkbox")).toHaveLength(24);
  expect(screen.getByText("546 of 546 NFTs selected")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Artwork 546" },
  });
  expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  expect(reviewButton(546)).toBeDisabled();
});
it("keeps unlisted metadata-pending NFTs editable and resolves their metadata from analysis", async () => {
  const p = {
    ...props(),
    items: [{ assetKey: offerAsset(1).asset_key, quantity: "1" }],
  };
  p.analyze.mockResolvedValue(offerAnalysis([offerPrice(1)]));
  render(<OfferPlanPanel {...p} />);
  expect(
    screen.getByRole("textbox", { name: "WETH price per NFT for NFT #1" })
  ).toBeEnabled();
  setMethod("match_bid");
  fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
  expect(
    await screen.findByRole("textbox", {
      name: "WETH price per NFT for Artwork 1",
    })
  ).toHaveValue("0.1");
  expect(reviewButton(1)).toBeEnabled();
});
it("discards a late analysis after changing the active profile", async () => {
  const p = props();
  let resolve!: (value: OfferPlanAnalysisView) => void;
  p.analyze.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { rerender } = render(<OfferPlanPanel {...p} />);
  setMethod("match_bid");
  fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
  rerender(
    <OfferPlanPanel {...p} profile={{ ...OFFER_PROFILE, id: "other" }} />
  );
  await act(async () => {
    resolve(offerAnalysis());
  });
  expect(priceInput(1)).toHaveValue("");
  expect(p.onReviewOffer).not.toHaveBeenCalled();
});
it("retains actual published commitments in the goal budget and binds each review ceiling", () => {
  const p = props();
  const { rerender } = render(<OfferPlanPanel {...p} />);
  setPrice(1, "0.25");
  setPrice(2, "0.25");
  setMethod("goal");
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" }),
    { target: { value: "0.5" } }
  );
  fireEvent.click(reviewButton(1));
  expect(p.onReviewOffer).toHaveBeenCalledWith(
    expect.objectContaining({ maximumOfferAmountWei: "250000000000000000" })
  );
  rerender(
    <OfferPlanPanel
      {...p}
      publishedOffers={[
        { assetKey: offerAsset(1).asset_key, amountWei: "300000000000000000" },
      ]}
    />
  );
  expect(reviewButton(1)).toBeDisabled();
  expect(reviewButton(2)).toBeDisabled();
  setPrice(2, "0.2");
  expect(reviewButton(2)).toBeEnabled();
  fireEvent.click(reviewButton(2));
  expect(p.onReviewOffer).toHaveBeenLastCalledWith(
    expect.objectContaining({ maximumOfferAmountWei: "200000000000000000" })
  );
});
it("does not reuse a goal budget when a published offer amount is unknown", () => {
  const p = props();
  const { rerender } = render(<OfferPlanPanel {...p} />);
  setPrice(1, "0.1");
  setPrice(2, "0.1");
  setMethod("goal");
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" }),
    { target: { value: "1" } }
  );
  rerender(
    <OfferPlanPanel {...p} publishedAssetKeys={[offerAsset(1).asset_key]} />
  );
  expect(reviewButton(2)).toBeDisabled();
});

it("discards an in-flight allocation when another offer is published", async () => {
  const p = props();
  let resolve!: (value: OfferPlanAnalysisView) => void;
  p.analyze.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { rerender } = render(<OfferPlanPanel {...p} />);
  setMethod("match_bid");
  fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
  rerender(
    <OfferPlanPanel
      {...p}
      publishedOffers={[
        { assetKey: offerAsset(1).asset_key, amountWei: "200000000000000000" },
      ]}
    />
  );
  await act(async () => {
    resolve(offerAnalysis());
  });
  expect(priceInput(2)).toHaveValue("");
  expect(reviewButton(1)).toBeDisabled();
  expect(p.onReviewOffer).not.toHaveBeenCalled();
});

it("locks unresolved offers and counts their exact commitments after clearing selection", () => {
  const p = props(),
    onReviewPending = jest.fn();
  const { rerender } = render(<OfferPlanPanel {...p} />);
  setPrice(1, "0.1");
  setPrice(2, "0.2");
  setMethod("goal");
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" }),
    { target: { value: "0.5" } }
  );
  const pendingOffer = {
    operationId: "pending",
    assetKey: offerAsset(1).asset_key,
    amountWei: "400000000000000000",
  };
  rerender(
    <OfferPlanPanel
      {...p}
      pendingOffers={[pendingOffer]}
      onReviewPending={onReviewPending}
    />
  );
  expect(priceInput(1)).toBeDisabled();
  expect(reviewButton(1)).toBeDisabled();
  expect(reviewButton(2)).toBeDisabled();
  expect(screen.queryByText("Offer published")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
  fireEvent.click(screen.getByRole("button", { name: "Select all" }));
  expect(reviewButton(2)).toBeDisabled();
  setPrice(2, "0.1");
  expect(reviewButton(2)).toBeEnabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Check offer status · NFT #1" })
  );
  expect(onReviewPending).toHaveBeenCalledWith(pendingOffer);
  expect(p.onReviewOffer).not.toHaveBeenCalled();
});

it.each(["improve_bid", "discount_ask"])(
  "clears generated prices after changing the %s percentage, preserving manual pins",
  async (method) => {
    const p = props();
    render(<OfferPlanPanel {...p} />);
    setPrice(1, "0.2");
    setMethod(method);
    fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
    await waitFor(() => expect(priceInput(2)).toHaveValue("0.1"));
    fireEvent.change(
      screen.getByRole("textbox", {
        name: method === "improve_bid" ? "Above offer (%)" : "Below ask (%)",
      }),
      { target: { value: "10" } }
    );
    expect(priceInput(1)).toHaveValue("0.2");
    expect(priceInput(2)).toHaveValue("");
    expect(reviewButton(2)).toBeDisabled();
    expect(p.onReviewOffer).not.toHaveBeenCalled();
  }
);

it("requires a new allocation after changing the goal budget, preserving manual pins", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} />);
  setPrice(1, "0.2");
  setMethod("goal");
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" }),
    { target: { value: "0.5" } }
  );
  fireEvent.click(screen.getByRole("button", { name: "Calculate prices" }));
  await waitFor(() => expect(priceInput(2)).toHaveValue("0.1"));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer budget (WETH)" }),
    { target: { value: "1" } }
  );
  expect(priceInput(1)).toHaveValue("0.2");
  expect(priceInput(2)).toHaveValue("");
  expect(reviewButton(2)).toBeDisabled();
});

it("uses a compact keyboard-accessible pricing chooser without submitting analysis", async () => {
  const p = props();
  render(<OfferPlanPanel {...p} />);
  const trigger = screen.getByRole("button", { name: "Price method" });
  expect(trigger).toHaveAccessibleDescription("Enter each price");
  expect(
    screen.queryByRole("combobox", { name: "Price method" })
  ).not.toBeInTheDocument();
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter" });
  const list = await screen.findByRole("listbox");
  expect(list).toHaveAccessibleName(/Price method/);
  expect(screen.getAllByRole("option")).toHaveLength(5);
  await waitFor(() => expect(list).toHaveFocus());
  fireEvent.keyDown(list, { key: "ArrowDown" });
  await waitFor(() =>
    expect(list).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Match observed WETH offer" }).id
    )
  );
  fireEvent.keyDown(list, { key: "Enter" });
  await waitFor(() =>
    expect(trigger).toHaveTextContent("Match observed WETH offer")
  );
  await waitFor(() => expect(trigger).toHaveFocus());
  fireEvent.keyDown(trigger, { key: "Enter" });
  fireEvent.keyDown(await screen.findByRole("listbox"), { key: "Escape" });
  await waitFor(() =>
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  );
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(p.analyze).not.toHaveBeenCalled();
});

it("keeps per-NFT expiry in details and preserves each explicit price, quantity, and expiry at review", () => {
  const p = props();
  render(<OfferPlanPanel {...p} />);
  expect(
    screen.getByRole("combobox", { name: "Default expiry" })
  ).toBeVisible();
  const expiry = screen.getByLabelText("Offer expiry for Artwork 1");
  expect(expiry).not.toBeVisible();
  fireEvent.click(screen.getByLabelText("Details and expiry for Artwork 1"));
  expect(expiry).toBeVisible();
  fireEvent.change(expiry, { target: { value: "24" } });
  setPrice(1, "0.125");
  fireEvent.change(
    screen.getByRole("textbox", { name: "Offer quantity for Artwork 1" }),
    {
      target: { value: "2" },
    }
  );
  fireEvent.click(reviewButton(1));
  expect(p.onReviewOffer).toHaveBeenCalledWith(
    expect.objectContaining({
      asset: offerAsset(1),
      unitPriceEth: "0.125",
      quantity: "2",
      expiryHours: "24",
    })
  );
  expect(screen.getByLabelText("Offer expiry for Artwork 2")).toHaveValue(
    "168"
  );
  expect(p.analyze).not.toHaveBeenCalled();
});
