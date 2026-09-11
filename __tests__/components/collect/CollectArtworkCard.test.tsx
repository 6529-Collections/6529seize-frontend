import CollectArtworkCard from "@/components/collect/CollectArtworkCard";
import type { CollectArtworkView } from "@/components/collect/collect.types";
import { fireEvent, render, screen, within } from "@testing-library/react";

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

it("keeps artwork navigation separate from transaction actions", () => {
  const onTrade = jest.fn();
  render(
    <CollectArtworkCard artwork={artwork} locale="en-US" onTrade={onTrade} />
  );
  const link = screen.getByRole("link", { name: "View Test artwork" });
  expect(within(link).queryByRole("button")).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Make offer: Test artwork" })
  );
  expect(onTrade).toHaveBeenCalledWith("1:memes:7", "offer");
  expect(screen.getByText("Check current orders")).toBeVisible();
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
    screen.getByRole("button", { name: "Buy: Test artwork" })
  ).toBeDisabled();
  expect(screen.getByText("Listing is no longer available")).toBeVisible();
});
