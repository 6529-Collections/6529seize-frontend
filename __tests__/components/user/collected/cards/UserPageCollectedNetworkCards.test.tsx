import UserPageCollectedNetworkCards from "@/components/user/collected/cards/UserPageCollectedNetworkCards";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import { t as translate } from "@/i18n/messages";
import { render, screen, within } from "@testing-library/react";
import React from "react";

jest.mock("@/i18n/messages", () => {
  const actual = jest.requireActual<typeof import("@/i18n/messages")>(
    "@/i18n/messages"
  );
  return {
    ...actual,
    t: jest.fn(actual.t),
  };
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: { readonly alt: string; readonly src: string }) =>
    React.createElement("img", { alt, src }),
}));

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

jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useTokenMetadataQuery: jest.fn(),
}));

const useTokenMetadataQueryMock = useTokenMetadataQuery as jest.Mock;
const translateMock = translate as jest.MockedFunction<typeof translate>;

const cards = [
  {
    contract: "0xabc",
    token: 101,
    xtdh: 42.25,
    xtdh_rate: 1.5,
  },
  {
    contract: "0xdef",
    token: 202,
    xtdh: 7,
    xtdh_rate: 0.25,
  },
] as any;

describe("UserPageCollectedNetworkCards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(paginationProps).forEach((key) => delete paginationProps[key]);
    useTokenMetadataQueryMock.mockReturnValue({ data: [] });
  });

  it("renders network cards as a labelled list with locale-aware fallback labels", () => {
    const setPage = jest.fn();
    useTokenMetadataQueryMock.mockReturnValue({
      data: [
        {
          tokenId: BigInt(101),
          tokenIdRaw: "101",
          contract: "0xabc",
          name: "First Token",
          imageUrl: "https://example.com/first.png",
          collectionName: "Cool Collection",
          isSpam: false,
        },
      ],
    });

    render(
      <UserPageCollectedNetworkCards
        cards={cards}
        page={2}
        setPage={setPage}
        next={true}
        locale="fr-FR"
      />
    );

    expect(useTokenMetadataQueryMock).toHaveBeenCalledWith({
      tokens: [
        { contract: "0xabc", tokenId: "101" },
        { contract: "0xdef", tokenId: "202" },
      ],
      enabled: true,
    });
    const cardsList = screen.getByRole("list", {
      name: "Collected network cards",
    });
    expect(within(cardsList).getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByRole("img", { name: "Network token image for First Token" })
    ).toHaveAttribute("src", "https://example.com/first.png");
    expect(screen.getByText("Cool Collection")).toBeInTheDocument();
    expect(screen.getByText("Token #202")).toBeInTheDocument();
    expect(screen.getAllByText("xTDH")).toHaveLength(2);
    expect(screen.getAllByText("xTDH/day")).toHaveLength(2);
    expect(screen.getByTestId("pagination")).toHaveTextContent("Page 2 of 3");
    expect(paginationProps.setCurrentPage).toBe(setPage);
    expect(paginationProps.haveNextPage).toBe(true);
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.networkCards.listLabel"
    );
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.networkCards.defaultTokenName",
      { tokenId: 202 }
    );
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.networkCards.imageAlt",
      { name: "First Token" }
    );
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.networkCards.tokenLabel",
      { tokenId: 202 }
    );
  });

  it("renders localized empty state and disables metadata fetching", () => {
    render(
      <UserPageCollectedNetworkCards
        cards={[]}
        page={1}
        setPage={() => {}}
        next={false}
      />
    );

    expect(screen.getByText("No network tokens found")).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Collected network cards" })
    ).toBeNull();
    expect(screen.queryByTestId("pagination")).toBeNull();
    expect(useTokenMetadataQueryMock).toHaveBeenCalledWith({
      tokens: [],
      enabled: false,
    });
  });
});
