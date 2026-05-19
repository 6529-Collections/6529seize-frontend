import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemeCardSetPicker from "@/components/waves/create-wave/voting/MemeCardSetPicker";
import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useCollectionSearch: jest.fn(() => ({
    data: { items: [], hiddenCount: 0 },
    isFetching: false,
  })),
  useContractOverviewQuery: jest.fn(() => ({
    data: null,
    isFetching: false,
  })),
  primeContractCache: jest.fn(),
}));

jest.mock("@/components/token-list/VirtualizedTokenList", () => ({
  VirtualizedTokenList: ({
    footerContent,
  }: {
    readonly footerContent?: ReactNode | undefined;
  }) => <div data-testid="token-list">{footerContent}</div>,
}));

function ControlledMemeCardSetPicker() {
  const [creditNfts, setCreditNfts] = useState<ApiWaveCreditNft[]>([]);

  return (
    <MemeCardSetPicker
      creditNfts={creditNfts}
      memeCount={100}
      isMemeCountLoading={false}
      isMemeCountError={false}
      errors={[]}
      onCreditNftsChange={setCreditNfts}
    />
  );
}

function renderControlledPicker() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ControlledMemeCardSetPicker />
    </QueryClientProvider>
  );
}

describe("MemeCardSetPicker with real NftPicker", () => {
  it("rejects typed Meme card ranges that include zero", async () => {
    const user = userEvent.setup();
    renderControlledPicker();

    const tokenInput = screen.getByLabelText("Add token IDs or ranges");
    await user.type(tokenInput, "0-2");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(
      screen.getByText("Only existing Meme card IDs can be added.")
    ).toBeInTheDocument();
    expect(screen.getByText("0 Meme cards selected")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("token-list")).not.toBeInTheDocument();
    });
  });

  it("rolls back a rejected typed Meme card ID in the picker UI", async () => {
    const user = userEvent.setup();
    renderControlledPicker();

    const tokenInput = screen.getByLabelText("Add token IDs or ranges");
    await user.type(tokenInput, "1");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("1 Meme card selected")).toBeInTheDocument();
    expect(screen.getByTestId("token-list")).toHaveTextContent("1");

    await user.type(tokenInput, "999999");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(
      screen.getByText("Only existing Meme card IDs can be added.")
    ).toBeInTheDocument();
    expect(screen.getByText("1 Meme card selected")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("token-list")).toHaveTextContent("1");
      expect(screen.getByTestId("token-list")).not.toHaveTextContent("999999");
    });
  });
});
