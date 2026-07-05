jest.mock("react", () => {
  const actual = jest.requireActual<typeof import("react")>("react");
  return {
    ...actual,
    useEffectEvent: (fn: (...args: unknown[]) => unknown) =>
      actual.useCallback(fn, []),
  };
});

import CollectionDelegationComponent from "@/components/delegation/CollectionDelegation";
import { ALL_USE_CASES } from "@/components/delegation/delegation-constants";
import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { fireEvent, render, screen } from "@testing-library/react";
import { useReadContract, useReadContracts, useWriteContract } from "wagmi";

jest.mock("wagmi", () => ({
  useReadContract: jest.fn(),
  useReadContracts: jest.fn(),
  useWriteContract: jest.fn(),
  useEnsName: jest.fn().mockReturnValue({ data: undefined }),
  useWaitForTransactionReceipt: jest.fn().mockReturnValue({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: undefined,
  }),
  useChainId: jest.fn().mockReturnValue(1),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x0", isConnected: true }),
}));

const mockUseReadContract = useReadContract as jest.Mock;
const mockUseReadContracts = useReadContracts as jest.Mock;
const mockUseWriteContract = useWriteContract as jest.Mock;
const mockWriteContract = jest.fn();

type Envelope = { status: "success" | "failure"; result?: unknown };

interface LockReadParams {
  contracts?: { functionName?: string; args?: unknown[] }[];
}

// getParams appends the primary/sub-delegation/consolidation trio after the
// provided use cases, so the use-case lock multicall has three extra entries.
const LOCK_MULTICALL_SIZE = ALL_USE_CASES.length + 3;

function buildEnvelopes(overrides: Record<number, Envelope>): Envelope[] {
  const envelopes: Envelope[] = Array.from(
    { length: LOCK_MULTICALL_SIZE },
    () => ({ status: "success", result: false })
  );
  for (const [index, envelope] of Object.entries(overrides)) {
    envelopes[Number(index)] = envelope;
  }
  return envelopes;
}

describe("CollectionDelegation use-case lock UI (issue #3078)", () => {
  const collection = {
    title: "Test Collection",
    display: "Test",
    contract: "0x1",
    preview: "",
  };
  const setSection = jest.fn();

  function mockLockReads(options: {
    statuses: Envelope[];
    global: Envelope[];
  }) {
    mockUseReadContracts.mockImplementation((params?: LockReadParams) => {
      const first = params?.contracts?.[0];
      if (first?.functionName !== "retrieveCollectionUseCaseLockStatus") {
        return { data: undefined, refetch: jest.fn() };
      }
      return {
        data:
          first.args?.[0] === DELEGATION_ALL_ADDRESS
            ? options.global
            : options.statuses,
        refetch: jest.fn(),
      };
    });
  }

  function renderComponent() {
    return render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );
  }

  function selectUseCase(value: number) {
    fireEvent.change(screen.getByLabelText("Lock or unlock use case"), {
      target: { value: String(value) },
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReadContract.mockReturnValue({});
    mockUseReadContracts.mockReturnValue({
      data: undefined,
      refetch: jest.fn(),
    });
    mockUseWriteContract.mockReturnValue({
      writeContract: mockWriteContract,
      reset: jest.fn(),
      data: undefined,
      error: undefined,
    });
  });

  it("labels use cases from decoded results instead of envelope truthiness", () => {
    mockLockReads({
      // Index 1 = use case #2 (locked), index 2 = use case #3 (unlocked),
      // index 3 = use case #4 (failed read).
      statuses: buildEnvelopes({
        1: { status: "success", result: true },
        3: { status: "failure", result: undefined },
      }),
      global: buildEnvelopes({}),
    });

    renderComponent();

    expect(
      screen.getByRole("option", { name: "#2 - Minting / Allowlist - LOCKED" })
    ).toBeInTheDocument();
    // With the envelope bug every option rendered LOCKED once data arrived;
    // a decoded false must now render UNLOCKED.
    expect(
      screen.getByRole("option", { name: "#3 - Airdrops - UNLOCKED" })
    ).toBeInTheDocument();
    // A failed multicall entry reads as unknown -> UNLOCKED, not LOCKED.
    expect(
      screen.getByRole("option", {
        name: "#4 - Voting / Governance - UNLOCKED",
      })
    ).toBeInTheDocument();
  });

  it("marks globally locked use cases with LOCKED and an asterisk", () => {
    mockLockReads({
      statuses: buildEnvelopes({}),
      // Index 4 = use case #5 locked at the all-collections scope.
      global: buildEnvelopes({ 4: { status: "success", result: true } }),
    });

    renderComponent();

    expect(
      screen.getByRole("option", { name: "#5 - Avatar Display - LOCKED *" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: "#2 - Minting / Allowlist - UNLOCKED",
      })
    ).toBeInTheDocument();
  });

  it("locks an unlocked use case with a Locking toast and lock=true args", () => {
    mockLockReads({
      statuses: buildEnvelopes({}),
      global: buildEnvelopes({}),
    });

    renderComponent();
    selectUseCase(3);

    const button = screen.getByRole("button", { name: /Lock Use Case/ });
    fireEvent.click(button);

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "setCollectionUsecaseLock",
        args: [collection.contract, 3, true],
      })
    );
    expect(
      screen.getByText("Locking Wallet on Use Case #3 - Airdrops")
    ).toBeInTheDocument();
  });

  it("unlocks a locked use case with an Unlocking toast and lock=false args", () => {
    mockLockReads({
      statuses: buildEnvelopes({ 1: { status: "success", result: true } }),
      global: buildEnvelopes({}),
    });

    renderComponent();
    selectUseCase(2);

    const button = screen.getByRole("button", { name: /Unlock Use Case/ });
    fireEvent.click(button);

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "setCollectionUsecaseLock",
        args: [collection.contract, 2, false],
      })
    );
    expect(
      screen.getByText("Unlocking Wallet on Use Case #2 - Minting / Allowlist")
    ).toBeInTheDocument();
  });

  it("points at All Collections instead of the lock button when globally locked", () => {
    mockLockReads({
      statuses: buildEnvelopes({}),
      global: buildEnvelopes({ 4: { status: "success", result: true } }),
    });

    renderComponent();
    selectUseCase(5);

    expect(
      screen.queryByRole("button", { name: /Lock Use Case|Unlock Use Case/ })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Unlock use case in/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "All Collections" })
    ).toBeInTheDocument();
  });

  it("still shows the lock button while global statuses are absent", () => {
    // Simulate the all-collections page shape: the global multicall gets
    // empty params and never produces data.
    mockUseReadContracts.mockImplementation((params?: LockReadParams) => {
      const first = params?.contracts?.[0];
      if (first?.functionName !== "retrieveCollectionUseCaseLockStatus") {
        return { data: undefined, refetch: jest.fn() };
      }
      return {
        data:
          first.args?.[0] === DELEGATION_ALL_ADDRESS
            ? undefined
            : buildEnvelopes({}),
        refetch: jest.fn(),
      };
    });

    renderComponent();
    selectUseCase(3);

    expect(
      screen.getByRole("button", { name: /Lock Use Case/ })
    ).toBeInTheDocument();
  });
});
