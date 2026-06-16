import UserPageCollectedCardsNoCards from "@/components/user/collected/cards/UserPageCollectedCardsNoCards";
import { CollectedCollectionType, CollectionSeized } from "@/entities/IProfile";
import type { MemeSeason } from "@/entities/ISeason";
import { render, screen } from "@testing-library/react";

describe("UserPageCollectedCardsNoCards messages", () => {
  function renderComponent(filters: any) {
    return render(<UserPageCollectedCardsNoCards filters={filters} />);
  }

  const mockSeason: MemeSeason = {
    id: 4,
    start_index: 1,
    end_index: 100,
    count: 100,
    name: "SZN4",
    display: "SZN 4",
  };

  it("shows generic message when seized filter active", () => {
    renderComponent({
      seized: CollectionSeized.SEIZED,
      collection: null,
      szn: null,
    });
    expect(screen.getByRole("status")).toHaveTextContent("No cards to display");
    expect(screen.getByText("No cards to display")).toBeInTheDocument();
  });

  it("shows full setter when no collection selected", () => {
    renderComponent({
      seized: CollectionSeized.NOT_SEIZED,
      collection: null,
      szn: null,
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Congratulations, full setter!"
    );
    expect(
      screen.getByText("Congratulations, full setter!")
    ).toBeInTheDocument();
  });

  it("shows season specific message for memes season", () => {
    renderComponent({
      seized: CollectionSeized.NOT_SEIZED,
      collection: CollectedCollectionType.MEMES,
      szn: mockSeason,
    });
    expect(
      screen.getByText("Congratulations, SZN 4 full setter!")
    ).toBeInTheDocument();
  });

  it("shows source-locale network empty state", () => {
    renderComponent({
      seized: CollectionSeized.NOT_SEIZED,
      collection: CollectedCollectionType.NETWORK,
      szn: null,
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "No network tokens found"
    );
  });

  it("shows gradient message", () => {
    renderComponent({
      seized: CollectionSeized.NOT_SEIZED,
      collection: CollectedCollectionType.GRADIENTS,
      szn: null,
    });
    expect(
      screen.getByText("Congratulations, Gradient full setter!")
    ).toBeInTheDocument();
  });
});
