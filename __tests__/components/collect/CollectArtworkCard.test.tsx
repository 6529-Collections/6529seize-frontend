import CollectArtworkCard from "@/components/collect/CollectArtworkCard";
import type { CollectArtworkView } from "@/components/collect/collect.types";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const artwork: CollectArtworkView = {
  id: "1:memes:7",
  title: "Test artwork",
  artist: "Test artist",
  tokenLabel: "The Memes #7",
  href: "/the-memes/7",
  media: <span>Artwork media</span>,
  ownedLabel: "Owned across your profile: 2",
  priceLabel: null,
  actions: [{ action: "offer" }],
};

it("shows daily TDH value prominently while keeping the exact purchase price and selection reachable", () => {
  const onToggle = jest.fn();
  render(
    <CollectArtworkCard
      artwork={{
        ...artwork,
        priceLabel: "0.0123456789 ETH",
        priceDescription: "Price for 3 copies",
        valueMetric: { value: "≈ 125", label: "base TDH/day per ETH" },
      }}
      locale="en-US"
      onTrade={jest.fn()}
      selection={{ selected: false, onToggle }}
    />
  );
  expect(screen.getByText("≈ 125")).toBeVisible();
  expect(screen.getByText("base TDH/day per ETH")).toBeVisible();
  expect(screen.getByText("0.0123456789 ETH")).toBeVisible();
  expect(screen.getByText("Price for 3 copies")).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Add Test artwork to selection" })
  );
  expect(onToggle).toHaveBeenCalledTimes(1);
});

it("keeps artwork navigation separate from compact transaction actions", async () => {
  const user = userEvent.setup();
  const onTrade = jest.fn();
  render(
    <CollectArtworkCard artwork={artwork} locale="en-US" onTrade={onTrade} />
  );
  const link = screen.getByRole("link", { name: "View Test artwork" });
  expect(within(link).queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByText("Make an offer")).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", {
      name: "More trading actions for Test artwork",
    })
  );
  await user.click(
    await screen.findByRole("menuitem", { name: "Make an offer: Test artwork" })
  );
  expect(onTrade).toHaveBeenCalledWith("1:memes:7", "offer");
  expect(screen.queryByText("Check current orders")).not.toBeInTheDocument();
});

it("never enables a purchase with an unavailable action", () => {
  render(
    <CollectArtworkCard
      artwork={{
        ...artwork,
        actions: [
          { action: "buy", disabledReason: "Listing is no longer available" },
        ],
      }}
      locale="en-US"
      onTrade={jest.fn()}
    />
  );
  expect(
    screen.getByRole("button", { name: "Collect Test artwork" })
  ).toBeDisabled();
  expect(screen.getByText("Listing is no longer available")).toBeVisible();
});

it("retains the quoted price and keeps Collect directly reachable", () => {
  const onTrade = jest.fn();
  render(
    <CollectArtworkCard
      artwork={{
        ...artwork,
        priceLabel: "0.01 ETH",
        actions: [{ action: "buy" }, { action: "list" }],
      }}
      locale="en-US"
      onTrade={onTrade}
    />
  );
  expect(screen.getByText("0.01 ETH")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Collect Test artwork" }));
  expect(onTrade).toHaveBeenCalledWith(artwork.id, "buy");
  expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
});

it("opens the action menu by keyboard and restores focus on Escape", async () => {
  const user = userEvent.setup();
  render(
    <CollectArtworkCard artwork={artwork} locale="en-US" onTrade={jest.fn()} />
  );
  const trigger = screen.getByRole("button", {
    name: "More trading actions for Test artwork",
  });
  trigger.focus();
  await user.keyboard("{Enter}");
  expect(
    await screen.findByRole("menuitem", { name: "Make an offer: Test artwork" })
  ).toBeVisible();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
});

it("keeps disabled secondary actions unavailable and explains why", async () => {
  const user = userEvent.setup();
  const onTrade = jest.fn();
  render(
    <CollectArtworkCard
      artwork={{
        ...artwork,
        actions: [{ action: "list", disabledReason: "Trading unavailable" }],
      }}
      locale="en-US"
      onTrade={onTrade}
    />
  );
  await user.click(
    screen.getByRole("button", {
      name: "More trading actions for Test artwork",
    })
  );
  const action = await screen.findByRole("menuitem", {
    name: "List: Test artwork. Trading unavailable",
  });
  expect(action).toBeDisabled();
  await user.click(action);
  expect(onTrade).not.toHaveBeenCalled();
});
