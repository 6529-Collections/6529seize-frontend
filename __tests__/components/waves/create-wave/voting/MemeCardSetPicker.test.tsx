import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemeCardSetPicker from "@/components/waves/create-wave/voting/MemeCardSetPicker";
import { MEMES_CONTRACT, GRADIENT_CONTRACT } from "@/constants/constants";
import { commonApiFetch } from "@/services/api/common-api";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/components/nft-picker/NftPicker", () => {
  const { MEMES_CONTRACT } = jest.requireActual("@/constants/constants");
  const nonMemeContract = "0x0000000000000000000000000000000000000001";

  return {
    NftPicker: (props: any) => (
      <div data-testid="nft-picker">
        <button
          type="button"
          onClick={() =>
            props.onChange({
              contractAddress: MEMES_CONTRACT,
              allSelected: false,
              outputMode: "number",
              tokenIds: [1, 5, 10, 11, 12],
            })
          }
        >
          emit-range
        </button>
        <button
          type="button"
          onClick={() =>
            props.onChange({
              contractAddress: MEMES_CONTRACT,
              allSelected: false,
              outputMode: "number",
              tokenIds: [1, 2, 3, 4],
            })
          }
        >
          emit-full-set
        </button>
        <button
          type="button"
          onClick={() =>
            props.onChange({
              contractAddress: MEMES_CONTRACT,
              allSelected: false,
              outputMode: "number",
              tokenIds: [3, 1, 3, -1, 2.5],
            })
          }
        >
          emit-unsorted-invalid
        </button>
        <button
          type="button"
          onClick={() =>
            props.onChange({
              contractAddress: nonMemeContract,
              allSelected: false,
              outputMode: "number",
              tokenIds: [1],
            })
          }
        >
          emit-non-meme
        </button>
      </div>
    ),
  };
});

const mockedCommonApiFetch = commonApiFetch as jest.Mock;

function renderPicker({
  creditNfts = [],
  memeCount = 100,
  isMemeCountLoading = false,
  isMemeCountError = false,
  errors = [],
  onCreditNftsChange = jest.fn(),
}: {
  readonly creditNfts?: any[];
  readonly memeCount?: number | null;
  readonly isMemeCountLoading?: boolean;
  readonly isMemeCountError?: boolean;
  readonly errors?: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onCreditNftsChange?: jest.Mock;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemeCardSetPicker
        creditNfts={creditNfts}
        memeCount={memeCount}
        isMemeCountLoading={isMemeCountLoading}
        isMemeCountError={isMemeCountError}
        errors={errors}
        onCreditNftsChange={onCreditNftsChange}
      />
    </QueryClientProvider>
  );

  return { onCreditNftsChange };
}

describe("MemeCardSetPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCommonApiFetch.mockImplementation(async ({ endpoint }) => {
      if (endpoint === "memes_extended_data") {
        return { count: 100, data: [], page: 1, next: null } as any;
      }
      if (endpoint === "nfts_search") {
        return [
          {
            id: 7,
            name: "Meme Card",
            contract: MEMES_CONTRACT,
            icon_url: "",
            thumbnail_url: "",
            image_url: "",
          },
          {
            id: 8,
            name: "Gradient Card",
            contract: GRADIENT_CONTRACT,
            icon_url: "",
            thumbnail_url: "",
            image_url: "",
          },
        ] as any;
      }
      return null as any;
    });
  });

  it("maps ID and range picker output to credit_nfts", async () => {
    const user = userEvent.setup();
    const { onCreditNftsChange } = renderPicker({ memeCount: 100 });

    await user.click(screen.getByRole("button", { name: "emit-range" }));

    expect(onCreditNftsChange).toHaveBeenCalledWith([
      { contract: MEMES_CONTRACT, token_id: 1 },
      { contract: MEMES_CONTRACT, token_id: 5 },
      { contract: MEMES_CONTRACT, token_id: 10 },
      { contract: MEMES_CONTRACT, token_id: 11 },
      { contract: MEMES_CONTRACT, token_id: 12 },
    ]);
  });

  it("search adds only Meme cards", async () => {
    const user = userEvent.setup();
    const { onCreditNftsChange } = renderPicker({ memeCount: 100 });

    await user.type(screen.getByLabelText("Add by search"), "meme");

    const memeResult = await screen.findByRole("button", {
      name: "Add The Memes #7",
    });
    expect(screen.queryByText(/Gradient Card/)).toBeNull();

    await user.click(memeResult);

    expect(onCreditNftsChange).toHaveBeenCalledWith([
      { contract: MEMES_CONTRACT, token_id: 7 },
    ]);
  });

  it("rejects non-Meme picker selections", async () => {
    const user = userEvent.setup();
    const { onCreditNftsChange } = renderPicker({ memeCount: 100 });

    await user.click(screen.getByRole("button", { name: "emit-non-meme" }));

    expect(onCreditNftsChange).not.toHaveBeenCalled();
    expect(
      screen.getByText("Only Meme cards can be added.")
    ).toBeInTheDocument();
  });

  it("blocks full Meme set selection", async () => {
    const user = userEvent.setup();
    const { onCreditNftsChange } = renderPicker({ memeCount: 4 });

    await user.click(screen.getByRole("button", { name: "emit-full-set" }));

    expect(onCreditNftsChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Selecting all Meme cards is the same as normal TDH. Choose a smaller set."
      )
    ).toBeInTheDocument();
  });

  it("shows count loading state from props", () => {
    renderPicker({ memeCount: null, isMemeCountLoading: true });

    expect(screen.getByText("Loading Meme card count...")).toBeInTheDocument();
  });

  it("shows a count load error from props", () => {
    renderPicker({ memeCount: null, isMemeCountError: true });

    expect(
      screen.getByText(
        "Unable to load Meme card count. You cannot continue until it loads."
      )
    ).toBeInTheDocument();
  });

  it("hides stale count unavailable validation once count is valid", () => {
    renderPicker({
      memeCount: 100,
      errors: [
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE,
      ],
    });

    expect(
      screen.queryByText("Meme card count is not loaded yet.")
    ).not.toBeInTheDocument();
  });

  it("keeps count unavailable validation visible without a valid count", () => {
    renderPicker({
      memeCount: null,
      errors: [
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE,
      ],
    });

    expect(
      screen.getByText("Meme card count is not loaded yet.")
    ).toBeInTheDocument();
  });

  it("shows count load error and validation separately", () => {
    renderPicker({
      memeCount: null,
      isMemeCountError: true,
      errors: [
        CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE,
      ],
    });

    expect(
      screen.getByText(
        "Unable to load Meme card count. You cannot continue until it loads."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Meme card count is not loaded yet.")
    ).toBeInTheDocument();
  });

  it("normalizes picker selections", async () => {
    const user = userEvent.setup();
    const { onCreditNftsChange } = renderPicker({ memeCount: 100 });

    await user.click(
      screen.getByRole("button", { name: "emit-unsorted-invalid" })
    );

    expect(onCreditNftsChange).toHaveBeenCalledWith([
      { contract: MEMES_CONTRACT, token_id: 1 },
      { contract: MEMES_CONTRACT, token_id: 3 },
    ]);
  });
});
