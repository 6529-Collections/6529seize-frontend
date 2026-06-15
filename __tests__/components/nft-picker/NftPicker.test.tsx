import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { NftPicker } from "@/components/nft-picker/NftPicker";
import type {
  ContractOverview,
  NftPickerProps,
} from "@/components/nft-picker/NftPicker.types";
import {
  useCollectionSearch,
  useContractOverviewQuery,
} from "@/hooks/useAlchemyNftQueries";

type VirtualizedTokenListMockProps = {
  readonly footerContent?: ReactNode | undefined;
};

jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useCollectionSearch: jest.fn(),
  useContractOverviewQuery: jest.fn(),
  primeContractCache: jest.fn(),
}));

jest.mock("@/hooks/useVirtualizedWaves", () => ({
  useVirtualizedWaves: ({ items }: { readonly items: readonly unknown[] }) => ({
    virtualItems: [
      ...items.map((_, index) => ({
        index,
        start: index * 64,
        size: 64,
      })),
      { index: items.length, start: items.length * 64, size: 40 },
    ],
    totalHeight: items.length * 64 + 40,
    sentinelRef: { current: null },
  }),
}));

jest.mock("@/components/token-list/VirtualizedTokenList", () => ({
  VirtualizedTokenList: ({ footerContent }: VirtualizedTokenListMockProps) => (
    <div data-testid="token-list">{footerContent}</div>
  ),
}));

const mockedUseCollectionSearch = useCollectionSearch as jest.Mock;
const mockedUseContractOverviewQuery = useContractOverviewQuery as jest.Mock;

const fixedContract: ContractOverview = {
  address: "0x000000000000000000000000000000000000dead",
  name: "The Memes",
  tokenType: "ERC721",
  totalSupply: "100",
  imageUrl: null,
  description: null,
  bannerImageUrl: null,
};

const searchContract: ContractOverview = {
  address: "0x000000000000000000000000000000000000beef",
  name: "Search Memes",
  tokenType: "ERC721",
  totalSupply: "50",
  imageUrl: null,
  description: null,
  bannerImageUrl: null,
};

function makeSequentialTokenIds(count: number): bigint[] {
  return Array.from({ length: count }, (_, index) => BigInt(index + 1));
}

function renderFixedPicker({
  onChange = jest.fn(),
  onContractChange = jest.fn(),
  defaultValue,
  outputMode = "number",
  maxSelectedCount,
  maxSelectedCountMessage,
}: {
  readonly onChange?: jest.Mock;
  readonly onContractChange?: jest.Mock;
  readonly defaultValue?: NftPickerProps["defaultValue"];
  readonly outputMode?: NftPickerProps["outputMode"];
  readonly maxSelectedCount?: NftPickerProps["maxSelectedCount"];
  readonly maxSelectedCountMessage?: NftPickerProps["maxSelectedCountMessage"];
} = {}) {
  render(
    <NftPicker
      fixedContract={fixedContract}
      onChange={onChange}
      onContractChange={onContractChange}
      defaultValue={defaultValue}
      outputMode={outputMode}
      maxSelectedCount={maxSelectedCount}
      maxSelectedCountMessage={maxSelectedCountMessage}
    />
  );

  return { onChange, onContractChange };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseCollectionSearch.mockReturnValue({
    data: { items: [], hiddenCount: 0 },
    isFetching: false,
  });
  mockedUseContractOverviewQuery.mockReturnValue({
    data: null,
    isFetching: false,
  });
});

describe("NftPicker fixedContract", () => {
  it("renders the fixed contract without collection search or clear-contract action", () => {
    const { onChange, onContractChange } = renderFixedPicker();

    expect(screen.getByText("The Memes")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Select collection")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear selection" })
    ).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(onContractChange).not.toHaveBeenCalled();
  });

  it("hydrates fixed default values without notifying parents on mount", async () => {
    const { onChange, onContractChange } = renderFixedPicker({
      defaultValue: {
        contractAddress: fixedContract.address,
        selectedIds: [1n],
        allSelected: false,
      },
    });

    expect(await screen.findByText("1 token selected")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(onContractChange).not.toHaveBeenCalled();
  });

  it("emits added token ranges with the fixed contract address", async () => {
    const user = userEvent.setup();
    const { onChange, onContractChange } = renderFixedPicker();

    await user.type(
      screen.getByLabelText("Add token IDs or ranges"),
      "1,5,10-12"
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenLastCalledWith({
      contractAddress: fixedContract.address,
      allSelected: false,
      outputMode: "number",
      tokenIds: [1, 5, 10, 11, 12],
    });
    expect(onContractChange).not.toHaveBeenCalled();
  });

  it("emits Select All for uncapped fixed contracts", async () => {
    const user = userEvent.setup();
    const { onChange } = renderFixedPicker();

    await user.click(screen.getByRole("button", { name: "Select All(100)" }));

    expect(onChange).toHaveBeenLastCalledWith({
      contractAddress: fixedContract.address,
      allSelected: true,
      outputMode: "number",
      tokenIds: [],
    });
  });

  it("emits the unsafe-token error payload and warning", async () => {
    const user = userEvent.setup();
    const { onChange } = renderFixedPicker();

    await user.type(
      screen.getByLabelText("Add token IDs or ranges"),
      "9007199254740992"
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenLastCalledWith({
      type: "error",
      error:
        "Token IDs exceed Number.MAX_SAFE_INTEGER. Switch to bigint output or remove those IDs.",
      unsafeCount: 1,
      contractAddress: fixedContract.address,
      outputMode: "number",
    });
    expect(
      await screen.findByText(/Some token IDs exceed Number\.MAX_SAFE_INTEGER/)
    ).toBeInTheDocument();
  });

  it("shows max-count errors beside the add-token input", async () => {
    const user = userEvent.setup();
    const maxSelectedCountMessage = "Select no more than two tokens.";
    const { onChange } = renderFixedPicker({
      maxSelectedCount: 2,
      maxSelectedCountMessage,
    });

    await user.type(screen.getByLabelText("Add token IDs or ranges"), "1-3");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(maxSelectedCountMessage)).toBeInTheDocument();
  });

  it("blocks Select All when the fixed contract exceeds the max count", async () => {
    const user = userEvent.setup();
    const maxSelectedCountMessage = "Select no more than two tokens.";
    const { onChange } = renderFixedPicker({
      maxSelectedCount: 2,
      maxSelectedCountMessage,
    });

    await user.click(screen.getByRole("button", { name: "Select All(100)" }));

    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ allSelected: true })
    );
    expect(screen.getByText(maxSelectedCountMessage)).toBeInTheDocument();
  });

  it("clears add-token max-count errors when the add input changes", async () => {
    const user = userEvent.setup();
    const maxSelectedCountMessage = "Select no more than two tokens.";
    renderFixedPicker({
      maxSelectedCount: 2,
      maxSelectedCountMessage,
    });

    const addInput = screen.getByLabelText("Add token IDs or ranges");
    await user.type(addInput, "1-3");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText(maxSelectedCountMessage)).toBeInTheDocument();

    await user.clear(addInput);
    await user.type(addInput, "1");

    expect(screen.queryByText(maxSelectedCountMessage)).not.toBeInTheDocument();
    expect(screen.getByText(/Looks good: 1/)).toBeInTheDocument();
  });

  it("keeps add input when a merged selection exceeds the enumeration limit", async () => {
    const user = userEvent.setup();
    const { onChange } = renderFixedPicker({
      defaultValue: {
        contractAddress: fixedContract.address,
        selectedIds: makeSequentialTokenIds(10_000),
        allSelected: false,
      },
    });

    expect(
      await screen.findByText("10,000 tokens selected")
    ).toBeInTheDocument();

    const addInput = screen.getByLabelText("Add token IDs or ranges");
    await user.type(addInput, "10001");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/exceeding the limit of 10,?000/i)
    ).toBeInTheDocument();
    expect(addInput).toHaveValue("10001");
    expect(screen.getByText("10,000 tokens selected")).toBeInTheDocument();
  });
});

describe("NftPicker contract search", () => {
  it("emits onContractChange only after a user selects a searched contract", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onContractChange = jest.fn();

    mockedUseCollectionSearch.mockImplementation(
      ({ query }: { query: string }) => ({
        data:
          query.length > 1
            ? { items: [searchContract], hiddenCount: 0 }
            : { items: [], hiddenCount: 0 },
        isFetching: false,
      })
    );

    render(
      <NftPicker
        onChange={onChange}
        onContractChange={onContractChange}
        outputMode="number"
        debounceMs={0}
      />
    );

    await user.type(screen.getByLabelText("Select collection"), "memes");
    const suggestionName = await screen.findByText("Search Memes");
    const suggestionButton = suggestionName.closest("button");
    expect(suggestionButton).not.toBeNull();
    await user.click(suggestionButton as HTMLButtonElement);

    expect(onContractChange).toHaveBeenCalledTimes(1);
    expect(onContractChange).toHaveBeenCalledWith({
      ...searchContract,
      description: null,
      bannerImageUrl: null,
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
