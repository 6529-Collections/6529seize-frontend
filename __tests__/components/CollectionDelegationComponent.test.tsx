jest.mock("react", () => {
  const actual = jest.requireActual<typeof import("react")>("react");
  return {
    ...actual,
    useEffectEvent: (fn: (...args: unknown[]) => unknown) =>
      actual.useCallback(fn, []),
  };
});

import CollectionDelegationComponent from "@/components/delegation/CollectionDelegation";
import { MEMES_COLLECTION } from "@/components/delegation/delegation-constants";
import { DelegationCenterSection } from "@/types/enums";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

jest.mock("wagmi", () => {
  const ensNameResult = { data: undefined };
  const waitReceiptResult = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: undefined,
  };

  return {
    useReadContract: jest.fn(),
    useReadContracts: jest.fn(),
    useWriteContract: jest.fn(),
    useEnsName: jest.fn().mockReturnValue(ensNameResult),
    useWaitForTransactionReceipt: jest.fn().mockReturnValue(waitReceiptResult),
    useChainId: jest.fn().mockReturnValue(1),
  };
});

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x0", isConnected: true }),
}));

const mockUseReadContract = useReadContract as jest.Mock;
const mockUseReadContracts = useReadContracts as jest.Mock;
const mockUseWaitForTransactionReceipt =
  useWaitForTransactionReceipt as jest.Mock;
const mockUseWriteContract = useWriteContract as jest.Mock;
const mockWriteContract = jest.fn();
const mockWriteContractReset = jest.fn();
const defaultWriteContractResult = {
  writeContract: mockWriteContract,
  reset: mockWriteContractReset,
  data: undefined,
  error: undefined,
};
const defaultWaitReceiptResult = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: undefined,
};

describe("CollectionDelegationComponent", () => {
  const collection = {
    title: "Test Collection",
    display: "Test",
    contract: "0x1",
    preview: "",
  };
  const setSection = jest.fn();

  function mockCollectionLockState(collectionLocked: boolean) {
    mockUseReadContract.mockImplementation((params?: { args?: string[] }) => ({
      data:
        params?.args?.[0] === collection.contract ? collectionLocked : false,
    }));
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReadContract.mockReturnValue({});
    mockUseReadContracts.mockReturnValue({
      data: undefined,
      refetch: jest.fn(),
    });
    mockUseWriteContract.mockReturnValue(defaultWriteContractResult);
    mockUseWaitForTransactionReceipt.mockReturnValue(defaultWaitReceiptResult);
  });

  it("renders collection title and back button works", () => {
    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );
    expect(screen.getByText("Test Collection")).toBeInTheDocument();

    const back = screen.getAllByText(/Back to Delegation Center/i)[0];
    fireEvent.click(back);
    expect(setSection).toHaveBeenCalledWith(DelegationCenterSection.CENTER);
  });

  it("renders the top back button before the collection title", () => {
    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    const heading = screen.getByRole("heading", {
      name: "Test Collection",
      level: 1,
    });
    const topBackButton = screen.getAllByRole("button", {
      name: /Back to Delegation Center/i,
    })[0];

    expect(
      topBackButton.compareDocumentPosition(heading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("shows fetching messages initially", () => {
    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );
    expect(
      screen.getAllByText(/Fetching outgoing delegations/i)[0]
    ).toBeInTheDocument();
  });

  it("keys collection scope descriptions from the contract address", () => {
    render(
      <CollectionDelegationComponent
        collection={{
          ...MEMES_COLLECTION,
          title: "Renamed Display Title",
        }}
        setSection={setSection}
      />
    );

    expect(
      screen.getByText("Records here apply only to The Memes collection.")
    ).toBeInTheDocument();
  });

  it("shows the locking toast title for unlocked collection locks", () => {
    mockCollectionLockState(false);

    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Lock Wallet" }));

    expect(screen.getByText("Locking Wallet")).toBeInTheDocument();
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [collection.contract, true],
        functionName: "setCollectionLock",
      })
    );
  });

  it("shows the unlocking toast title for locked collection locks", () => {
    mockCollectionLockState(true);

    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Unlock Wallet" }));

    expect(screen.getByText("Unlocking Wallet")).toBeInTheDocument();
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [collection.contract, false],
        functionName: "setCollectionLock",
      })
    );
  });

  it("shows collection lock receipt failures instead of success", () => {
    mockCollectionLockState(false);
    mockUseWriteContract
      .mockReturnValueOnce(defaultWriteContractResult)
      .mockReturnValueOnce(defaultWriteContractResult)
      .mockReturnValueOnce({
        ...defaultWriteContractResult,
        data: "0xlock",
      })
      .mockReturnValue(defaultWriteContractResult);
    mockUseWaitForTransactionReceipt
      .mockReturnValueOnce(defaultWaitReceiptResult)
      .mockReturnValueOnce(defaultWaitReceiptResult)
      .mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: new Error("receipt failed Request Arguments"),
      })
      .mockReturnValue(defaultWaitReceiptResult);

    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    expect(screen.getByText("Locking Wallet Failed")).toBeInTheDocument();
    expect(screen.getByText("receipt failed")).toBeInTheDocument();
    expect(
      screen.queryByText(/Transaction Successful!/i)
    ).not.toBeInTheDocument();
  });
});
