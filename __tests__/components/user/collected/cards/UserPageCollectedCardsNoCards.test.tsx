import UserPageCollectedCardsNoCards from "@/components/user/collected/cards/UserPageCollectedCardsNoCards";
import { CollectedCollectionType, CollectionSeized } from "@/entities/IProfile";
import type { MemeSeason } from "@/entities/ISeason";
import { t as translate } from "@/i18n/messages";
import { render, screen } from "@testing-library/react";

jest.mock("@/i18n/messages", () => {
  const actual =
    jest.requireActual<typeof import("@/i18n/messages")>("@/i18n/messages");
  return {
    ...actual,
    t: jest.fn(actual.t),
  };
});

const translateMock = translate as jest.MockedFunction<typeof translate>;

describe("UserPageCollectedCardsNoCards messages", () => {
  function renderComponent(
    filters: any,
    locale: Parameters<typeof translate>[0] = "en-US"
  ) {
    return render(
      <UserPageCollectedCardsNoCards filters={filters} locale={locale} />
    );
  }

  const mockSeason: MemeSeason = {
    id: 4,
    start_index: 1,
    end_index: 100,
    count: 100,
    name: "SZN4",
    display: "SZN 4",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows generic message when seized filter active", () => {
    renderComponent(
      {
        seized: CollectionSeized.SEIZED,
        collection: null,
        szn: null,
      },
      "de-DE"
    );
    expect(screen.getByRole("status")).toHaveTextContent("No cards to display");
    expect(screen.getByText("No cards to display")).toBeInTheDocument();
    expect(translateMock).toHaveBeenCalledWith(
      "de-DE",
      "user.collected.empty.noCards"
    );
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
    renderComponent(
      {
        seized: CollectionSeized.NOT_SEIZED,
        collection: CollectedCollectionType.MEMES,
        szn: mockSeason,
      },
      "fr-FR"
    );
    expect(
      screen.getByText("Congratulations, SZN 4 full setter!")
    ).toBeInTheDocument();
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.empty.seasonFullSetter",
      { season: "SZN 4" }
    );
  });

  it("shows source-locale network empty state", () => {
    renderComponent(
      {
        seized: CollectionSeized.NOT_SEIZED,
        collection: CollectedCollectionType.NETWORK,
        szn: null,
      },
      "de-DE"
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No network tokens found"
    );
    expect(translateMock).toHaveBeenCalledWith(
      "de-DE",
      "user.collected.networkCards.empty"
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
