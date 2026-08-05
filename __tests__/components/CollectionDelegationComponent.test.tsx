jest.mock("react", () => {
  const actual = jest.requireActual<typeof import("react")>("react");
  return {
    ...actual,
    useEffectEvent: (fn: (...args: unknown[]) => unknown) =>
      actual.useCallback(fn, []),
  };
});

import CollectionDelegationComponent from "@/components/delegation/CollectionDelegation";
import {
  ALL_USE_CASES,
  MEMES_COLLECTION,
} from "@/components/delegation/delegation-constants";
import { DelegationCenterSection } from "@/types/enums";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

let mockAccountAddress: string | undefined = "0x0";
let mockAccountIsConnected = true;
const mockSeizeConnect = jest.fn();

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockAccountAddress,
    isConnected: mockAccountIsConnected,
    seizeConnect: mockSeizeConnect,
  }),
}));

jest.mock("@/components/delegation/UpdateDelegation", () => ({
  __esModule: true,
  default: (props: { onHide: () => void }) => (
    <button type="button" onClick={props.onHide}>
      Cancel Update
    </button>
  ),
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

  function mockUseCaseLockState(options: {
    readonly localLockedIndex?: number;
    readonly globalLockedIndex?: number;
  }) {
    mockUseReadContracts.mockImplementation(
      (params?: {
        contracts?: {
          functionName?: string;
          args?: readonly (string | number | undefined)[];
        }[];
      }) => {
        const firstContract = params?.contracts?.[0];
        if (
          firstContract?.functionName !== "retrieveCollectionUseCaseLockStatus"
        ) {
          return { data: undefined, refetch: jest.fn() };
        }

        const isLocalScope = firstContract.args?.[0] === collection.contract;
        const lockedIndex = isLocalScope
          ? options.localLockedIndex
          : options.globalLockedIndex;

        return {
          data: ALL_USE_CASES.map((_, index) => ({
            result: index === lockedIndex,
          })),
          refetch: jest.fn(),
        };
      }
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccountAddress = "0x0";
    mockAccountIsConnected = true;
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

  it("shows fetching messages when opened", () => {
    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Outgoing Delegations/i })
    );
    expect(screen.getAllByText(/Fetching outgoing/i)[0]).toBeInTheDocument();
  });

  it("shows an actionable error when the initial delegation read fails", () => {
    const retryOutgoing = jest.fn();
    const outgoingRead = {
      data: undefined,
      isError: true,
      refetch: retryOutgoing,
    };
    const incomingRead = {
      data: [],
      isError: false,
      refetch: jest.fn(),
    };
    const emptyRead = {
      data: undefined,
      isError: false,
      refetch: jest.fn(),
    };
    mockUseReadContracts.mockImplementation(
      (params?: { contracts?: { functionName?: string }[] }) => {
        const functionName = params?.contracts?.[0]?.functionName;
        if (
          functionName === "retrieveDelegationAddressesTokensIDsandExpiredDates"
        ) {
          return outgoingRead;
        }
        if (functionName === "retrieveDelegatorsTokensIDsandExpiredDates") {
          return incomingRead;
        }
        return emptyRead;
      }
    );

    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Outgoing Delegations/i })
    );

    expect(
      screen.getByText("Unable to load delegation records for Test Collection.")
    ).toBeInTheDocument();
    const retryCallsBeforeClick = retryOutgoing.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(retryOutgoing).toHaveBeenCalledTimes(retryCallsBeforeClick + 1);
  });

  it("preserves disclosure state across the update form transition", async () => {
    const outgoingRead: {
      data: undefined | { result: [string[], number[], boolean[], number[]] }[];
      refetch: jest.Mock;
    } = {
      data: undefined,
      refetch: jest.fn(),
    };
    const incomingRead = { data: [], refetch: jest.fn() };
    const emptyRead = { data: undefined, refetch: jest.fn() };

    mockUseReadContracts.mockImplementation(
      (params?: { contracts?: { functionName?: string }[] }) => {
        const functionName = params?.contracts?.[0]?.functionName;
        if (
          functionName === "retrieveDelegationAddressesTokensIDsandExpiredDates"
        ) {
          return outgoingRead;
        }
        if (functionName === "retrieveDelegatorsTokensIDsandExpiredDates") {
          return incomingRead;
        }
        return emptyRead;
      }
    );

    const { container, rerender } = render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    outgoingRead.data = [
      {
        result: [["0x2"], [0], [true], [0]],
      },
    ];
    rerender(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    const outgoingDisclosure = screen.getByRole("button", {
      name: /Outgoing Delegations/i,
    });
    const incomingDisclosure = screen.getByRole("button", {
      name: /Incoming Delegations/i,
    });

    await waitFor(() =>
      expect(outgoingDisclosure).toHaveAttribute("aria-expanded", "true")
    );
    fireEvent.click(incomingDisclosure);
    expect(incomingDisclosure).toHaveAttribute("aria-expanded", "true");

    const editAction = container.querySelector<SVGElement>(
      '[data-tooltip-id^="edit-"]'
    );
    if (!editAction) {
      throw new Error("Expected an edit action for the outgoing delegation");
    }
    fireEvent.click(editAction);

    fireEvent.click(screen.getByRole("button", { name: "Cancel Update" }));

    expect(
      screen.getByRole("button", { name: /Incoming Delegations/i })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("closes an open action form when the connected account changes", async () => {
    const outgoingRead: {
      data: undefined | { result: [string[], number[], boolean[], number[]] }[];
      refetch: jest.Mock;
    } = {
      data: undefined,
      refetch: jest.fn(),
    };
    const incomingRead = { data: [], refetch: jest.fn() };
    const emptyRead = { data: undefined, refetch: jest.fn() };

    mockUseReadContracts.mockImplementation(
      (params?: { contracts?: { functionName?: string }[] }) => {
        const functionName = params?.contracts?.[0]?.functionName;
        if (
          functionName === "retrieveDelegationAddressesTokensIDsandExpiredDates"
        ) {
          return outgoingRead;
        }
        if (functionName === "retrieveDelegatorsTokensIDsandExpiredDates") {
          return incomingRead;
        }
        return emptyRead;
      }
    );

    const { container, rerender } = render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    outgoingRead.data = [
      {
        result: [["0x2"], [0], [true], [0]],
      },
    ];
    rerender(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    await waitFor(() =>
      expect(
        container.querySelector('[data-tooltip-id^="edit-"]')
      ).not.toBeNull()
    );
    const editAction = container.querySelector<SVGElement>(
      '[data-tooltip-id^="edit-"]'
    );
    if (!editAction) {
      throw new Error("Expected an edit action for the outgoing delegation");
    }
    fireEvent.click(editAction);
    expect(
      screen.getByRole("button", { name: "Cancel Update" })
    ).toBeInTheDocument();

    mockAccountAddress = "0x9";
    rerender(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Cancel Update" })
      ).not.toBeInTheDocument()
    );
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

  it.each([
    { useCase: 997, index: 17, label: "Primary Address" },
    {
      useCase: 998,
      index: 18,
      label: "Delegation Management (Sub-Delegation)",
    },
    { useCase: 999, index: 19, label: "Consolidation" },
  ])(
    "unlocks special use case $useCase using its actual multicall slot",
    ({ useCase, index, label }) => {
      mockUseCaseLockState({ localLockedIndex: index });

      render(
        <CollectionDelegationComponent
          collection={collection}
          setSection={setSection}
        />
      );

      fireEvent.change(
        screen.getByRole("combobox", { name: "Lock or unlock use case" }),
        { target: { value: String(useCase) } }
      );
      fireEvent.click(screen.getByRole("button", { name: "Unlock Use Case" }));

      const expectedTitle = `Unlocking Wallet on Use Case\n#${useCase} ${label}`;
      const title = screen
        .getAllByRole("heading", { level: 2 })
        .find((heading) => heading.textContent === expectedTitle);
      if (!title) {
        throw new Error(`Expected transaction title: ${expectedTitle}`);
      }
      expect(title.textContent).toBe(expectedTitle);
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [collection.contract, useCase, false],
          functionName: "setCollectionUsecaseLock",
        })
      );
    }
  );

  it("blocks a collection-specific use-case update when the global lock is set", () => {
    mockUseCaseLockState({ globalLockedIndex: 19 });

    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Lock or unlock use case" }),
      { target: { value: "999" } }
    );

    expect(
      screen.queryByRole("button", { name: /^(Lock|Unlock) Use Case$/ })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Unlock use case in/i)).toBeInTheDocument();
  });

  it.each([
    { lockScope: "collection", globalLocked: false },
    { lockScope: "all collections", globalLocked: true },
  ])(
    "removes a selected use-case action when the $lockScope wallet lock activates",
    ({ globalLocked }) => {
      let collectionLocked = false;
      let allCollectionsLocked = false;
      mockUseReadContract.mockImplementation(
        (params?: { args?: readonly (string | undefined)[] }) => ({
          data:
            params?.args?.[0] === collection.contract
              ? collectionLocked
              : allCollectionsLocked,
        })
      );

      const { rerender } = render(
        <CollectionDelegationComponent
          collection={collection}
          setSection={setSection}
        />
      );
      const select = screen.getByRole("combobox", {
        name: "Lock or unlock use case",
      });
      fireEvent.change(select, { target: { value: "3" } });
      expect(
        screen.getByRole("button", { name: "Lock Use Case" })
      ).toBeInTheDocument();

      if (globalLocked) {
        allCollectionsLocked = true;
      } else {
        collectionLocked = true;
      }
      rerender(
        <CollectionDelegationComponent
          collection={collection}
          setSection={setSection}
        />
      );

      expect(select).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: "Lock Use Case" })
      ).not.toBeInTheDocument();
      expect(mockWriteContract).not.toHaveBeenCalled();
    }
  );

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
    expect(screen.getByDisplayValue("receipt failed")).toBeInTheDocument();
    expect(
      screen.queryByText(/Transaction Successful!/i)
    ).not.toBeInTheDocument();
  });
});
