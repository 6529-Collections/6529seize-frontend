import { render, screen, waitFor } from "@testing-library/react";
import NextGenCollectionMint from "@/components/nextGen/collections/collectionParts/mint/NextGenCollectionMint";
import { useReadContract } from "wagmi";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: jest.fn(() => ({
    hideNftPurchasing: false,
    shouldRedirect: false,
  })),
}));

const MockNextGenMint = jest.fn((props: any) => (
  <div data-testid="mint-props">
    {props.mint_price}:{props.burn_amount}
  </div>
));

jest.mock(
  "@/components/nextGen/collections/collectionParts/mint/NextGenMint",
  () => ({
    __esModule: true,
    default: (props: any) => MockNextGenMint(props),
  })
);

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => ({
    __esModule: true,
    default: () => <div data-testid="collection-header" />,
    NextGenBackToCollectionPageLink: () => <div data-testid="back-link" />,
  })
);

jest.mock("wagmi", () => ({ useReadContract: jest.fn() }));

const readMock = useReadContract as jest.Mock;

const collection = { id: 1, name: "My Collection" } as any;

let callIndex: number;

beforeEach(() => {
  jest.clearAllMocks();
  callIndex = 0;
  jest
    .mocked(useNftPurchasingVisibility)
    .mockReturnValue({ hideNftPurchasing: false, shouldRedirect: false });
});

function setupBurnAndPrice(burnData: any, priceData: any) {
  readMock.mockImplementation(() => {
    return callIndex++ % 2 === 0 ? burnData : priceData;
  });
  render(<NextGenCollectionMint collection={collection} />);
}

describe("NextGenCollectionMint", () => {
  it("redirects restricted iOS without calling contract hooks or mounting mint UI", () => {
    jest
      .mocked(useNftPurchasingVisibility)
      .mockReturnValue({ hideNftPurchasing: true, shouldRedirect: true });
    const { container } = render(
      <NextGenCollectionMint collection={collection} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(readMock).not.toHaveBeenCalled();
    expect(MockNextGenMint).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(
      "/nextgen/collection/my-collection"
    );
  });
  it("renders mint component with parsed values", async () => {
    setupBurnAndPrice(
      { data: "10", isSuccess: true },
      { data: "5", isSuccess: true }
    );
    await waitFor(() => {
      expect(MockNextGenMint).toHaveBeenLastCalledWith(
        expect.objectContaining({ burn_amount: 10, mint_price: 5, collection })
      );
    });
    expect(screen.getByTestId("mint-props").textContent).toBe("5:10");
  });

  it("skips rendering when data not loaded", () => {
    setupBurnAndPrice(
      { data: "2", isSuccess: true },
      { data: undefined, isSuccess: false }
    );
    expect(screen.queryByTestId("mint-props")).toBeNull();
  });

  it("falls back to 0 when price not numeric", async () => {
    setupBurnAndPrice(
      { data: "3", isSuccess: true },
      { data: "abc", isSuccess: true }
    );
    await waitFor(() => {
      expect(MockNextGenMint).toHaveBeenLastCalledWith(
        expect.objectContaining({ burn_amount: 3, mint_price: 0 })
      );
    });
    expect(screen.getByTestId("mint-props").textContent).toBe("0:3");
  });

  it("renders refreshed contract values without an effect-lagged frame", () => {
    let burnResult = { data: "10", isSuccess: true };
    let priceResult = { data: "5", isSuccess: true };
    readMock.mockImplementation(({ functionName }) =>
      functionName === "burnAmount" ? burnResult : priceResult
    );

    const { rerender } = render(
      <NextGenCollectionMint collection={collection} />
    );
    expect(screen.getByTestId("mint-props")).toHaveTextContent("5:10");

    burnResult = { data: "12", isSuccess: true };
    priceResult = { data: "7", isSuccess: true };
    rerender(<NextGenCollectionMint collection={collection} />);

    expect(screen.getByTestId("mint-props")).toHaveTextContent("7:12");
  });
});
