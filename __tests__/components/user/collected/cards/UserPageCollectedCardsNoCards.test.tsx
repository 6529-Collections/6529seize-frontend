import UserPageCollectedCardsNoCards from "@/components/user/collected/cards/UserPageCollectedCardsNoCards";
import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
} from "@/entities/IProfile";
import type { ProfileCollectedFilters } from "@/components/user/collected/UserPageCollected";
import { SortDirection } from "@/entities/ISort";
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
const baseFilters: ProfileCollectedFilters = {
  handleOrWallet: "testuser",
  accountForConsolidations: true,
  collection: CollectedCollectionType.MEMES,
  subcollection: null,
  seized: CollectionSeized.SEIZED,
  szn: null,
  initialSznId: null,
  page: 1,
  pageSize: 24,
  sortBy: CollectionSort.TOKEN_ID,
  sortDirection: SortDirection.DESC,
};

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

  it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
    "provides recovery copy with locale fallback in %s",
    (locale) => {
      render(
        <UserPageCollectedCardsNoCards
          filters={baseFilters}
          locale={locale}
          onClearFilters={jest.fn()}
          isLoading
        />
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        "No artwork matches these filters."
      );
      expect(
        screen.getByRole("button", { name: "Clear filters" })
      ).toBeDisabled();
    }
  );

  it("preserves full-set congratulations while offering filter recovery", () => {
    render(
      <UserPageCollectedCardsNoCards
        filters={{
          ...baseFilters,
          seized: CollectionSeized.NOT_SEIZED,
          collection: CollectedCollectionType.MEMES,
          szn: mockSeason,
        }}
        onClearFilters={jest.fn()}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Congratulations, SZN 4 full setter!"
    );
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeEnabled();
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
