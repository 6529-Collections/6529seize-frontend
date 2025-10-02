import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextGenTokenList from "@/components/nextGen/collections/NextGenTokenList";
import {
  NextGenListFilters,
  NextGenTokenListedType,
} from "@/components/nextGen/nextgen_helpers";
import { SortDirection } from "@/entities/ISort";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenTokenImage",
  () => ({
    NextGenTokenImage: ({ token }: any) => (
      <div data-testid="token">{token.name}</div>
    ),
  })
);

jest.mock(
  "@/components/pagination/Pagination",
  () => (props: any) =>
    (
      <div data-testid="pagination">
        <button onClick={() => props.setPage(props.page + 1)}>next</button>
      </div>
    )
);

jest.mock("@/components/dotLoader/DotLoader", () => () => (
  <div data-testid="loader" />
));

jest.mock("@/helpers/AllowlistToolHelpers", () => ({
  getRandomObjectId: () => "id",
}));

jest.mock("react-bootstrap", () => {
  return {
    Container: (p: any) => <div data-testid="container" {...p} />,
    Row: (p: any) => <div data-testid="row" {...p} />,
    Col: (p: any) => <div data-testid="col" {...p} />,
  };
});

const { commonApiFetch } = require("@/services/api/common-api");

const collection = { id: 1, name: "Collection" } as any;
const token = { id: 1, name: "Token", normalised_id: 1 } as any;

function setup(props: any = {}) {
  (commonApiFetch as jest.Mock).mockResolvedValue({ count: 1, data: [token] });
  return render(<NextGenTokenList collection={collection} {...props} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  // @ts-ignore
  window.scrollTo = jest.fn();
});

it("fetches tokens on mount and displays them", async () => {
  setup();
  await screen.findByTestId("token");
  expect(commonApiFetch).toHaveBeenCalledWith({
    endpoint: `nextgen/collections/${collection.id}/tokens?page_size=48&page=1&sort=random`,
  });
  expect(screen.getByText("Token")).toBeInTheDocument();
});

it("shows message when no results found", async () => {
  (commonApiFetch as jest.Mock).mockResolvedValue({ count: 0, data: [] });
  render(<NextGenTokenList collection={collection} />);
  await screen.findByText("No results found");
});

it("requests next page with pagination", async () => {
  (commonApiFetch as jest.Mock)
    .mockResolvedValueOnce({ count: 50, data: [token] }) // first mount fetch
    .mockResolvedValueOnce({ count: 50, data: [token] }) // second mount fetch
    .mockResolvedValueOnce({ count: 50, data: [token] }); // after clicking next
  render(<NextGenTokenList collection={collection} show_pagination />);

  await screen.findByTestId("token");
  await userEvent.click(screen.getByText("next"));

  await waitFor(() =>
    expect(commonApiFetch).toHaveBeenLastCalledWith({
      endpoint: `nextgen/collections/${collection.id}/tokens?page_size=48&page=2&sort=random`,
    })
  );
  expect(commonApiFetch).toHaveBeenCalledTimes(3);
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
});

it("builds endpoint with filters", async () => {
  setup({
    limit: 10,
    selected_traits: [
      { trait: "Color", value: "Red" },
      { trait: "Size", value: "Large" },
    ],
    show_normalised: true,
    show_trait_count: true,
    listed_type: NextGenTokenListedType.LISTED,
    sort: NextGenListFilters.RARITY_SCORE,
    sort_direction: SortDirection.DESC,
  });

  await screen.findByTestId("token");
  const traits = encodeURIComponent("Color:Red,Size:Large");
  const endpoint =
    `nextgen/collections/${collection.id}/tokens?page_size=10&page=1` +
    `&traits=${traits}` +
    `&show_normalised=true` +
    `&show_trait_count=true` +
    `&listed=true` +
    `&sort=rarity_score` +
    `&sort_direction=desc`;
  expect(commonApiFetch).toHaveBeenCalledWith({ endpoint });
});
