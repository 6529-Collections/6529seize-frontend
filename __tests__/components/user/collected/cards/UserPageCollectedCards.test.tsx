import { TransferProvider } from "@/components/nft-transfer/TransferState";
import UserPageCollectedCards from "@/components/user/collected/cards/UserPageCollectedCards";
import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
} from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import { t as translate } from "@/i18n/messages";
import { render, screen, within } from "@testing-library/react";
import React from "react";

jest.mock("@/i18n/messages", () => {
  const actual =
    jest.requireActual<typeof import("@/i18n/messages")>("@/i18n/messages");
  return {
    ...actual,
    t: jest.fn(actual.t),
  };
});

jest.mock("@/components/user/collected/cards/UserPageCollectedCard", () => {
  const MockedCard = (props: any) => (
    <div data-testid="card" data-show-data-row={props.showDataRow}>
      {props.card.token_id}
    </div>
  );
  MockedCard.displayName = "UserPageCollectedCard";
  return MockedCard;
});

const paginationProps: any = {};
jest.mock("@/components/utils/table/paginator/CommonTablePagination", () => {
  const MockedPagination = (props: any) => {
    Object.assign(paginationProps, props);
    return (
      <div data-testid="pagination">
        Page {props.currentPage} of {props.totalPages}
      </div>
    );
  };
  MockedPagination.displayName = "CommonTablePagination";
  return MockedPagination;
});

jest.mock(
  "@/components/user/collected/cards/UserPageCollectedCardsNoCards",
  () => {
    const MockedNoCards = (props: any) => (
      <div data-testid="no-cards" data-locale={props.locale}>
        {String(props.filters.collection)}
      </div>
    );

    MockedNoCards.displayName = "UserPageCollectedCardsNoCards";
    return MockedNoCards;
  }
);

const sampleCards = [
  {
    collection: CollectedCollectionType.MEMES,
    token_id: 1,
    token_name: "A",
    img: "a.png",
    tdh: null,
    rank: null,
    seized_count: null,
    szn: null,
  },
  {
    collection: CollectedCollectionType.MEMES,
    token_id: 2,
    token_name: "B",
    img: "b.png",
    tdh: null,
    rank: null,
    seized_count: null,
    szn: null,
  },
] as any;

const baseFilters = {
  handleOrWallet: "",
  accountForConsolidations: false,
  collection: null,
  seized: CollectionSeized.NOT_SEIZED,
  szn: null,
  page: 1,
  pageSize: 20,
  sortBy: CollectionSort.TOKEN_ID,
  sortDirection: SortDirection.ASC,
} as any;

const renderWithProviders = (component: React.ReactNode) => {
  return render(<TransferProvider>{component}</TransferProvider>);
};

const translateMock = translate as jest.MockedFunction<typeof translate>;

describe("UserPageCollectedCards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(paginationProps)) {
      delete paginationProps[key];
    }
  });

  it("renders cards and pagination when cards exist", () => {
    const setPage = jest.fn();
    renderWithProviders(
      <UserPageCollectedCards
        cards={sampleCards}
        totalPages={3}
        page={2}
        showDataRow={true}
        filters={{ ...baseFilters, collection: null }}
        setPage={setPage}
        dataTransfer={[]}
        locale="fr-FR"
      />
    );

    const cardsList = screen.getByRole("list", { name: "Collected cards" });
    expect(within(cardsList).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByTestId("card")).toHaveLength(2);
    expect(screen.getAllByTestId("card")[0]).toHaveAttribute(
      "data-show-data-row",
      "true"
    );
    expect(screen.getByTestId("pagination")).toHaveTextContent("Page 2 of 3");
    expect(paginationProps.setCurrentPage).toBe(setPage);
    expect(paginationProps.haveNextPage).toBe(true);
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.cards.listLabel"
    );
  });

  it("omits pagination when only one page", () => {
    renderWithProviders(
      <UserPageCollectedCards
        cards={sampleCards}
        totalPages={1}
        page={1}
        showDataRow={false}
        filters={{ ...baseFilters, collection: null }}
        setPage={() => {}}
        dataTransfer={[]}
      />
    );

    expect(screen.queryByTestId("pagination")).toBeNull();
  });

  it("renders no-cards message when list empty", () => {
    renderWithProviders(
      <UserPageCollectedCards
        cards={[]}
        totalPages={0}
        page={1}
        showDataRow={false}
        filters={{ ...baseFilters, collection: CollectedCollectionType.MEMES }}
        setPage={() => {}}
        dataTransfer={[]}
        locale="de-DE"
      />
    );

    expect(screen.getByTestId("no-cards")).toHaveTextContent("MEMES");
    expect(screen.getByTestId("no-cards")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
    expect(screen.queryByRole("list", { name: "Collected cards" })).toBeNull();
    expect(screen.queryByTestId("card")).toBeNull();
  });
});
