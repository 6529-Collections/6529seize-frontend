import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useResubmissionDelete } from "@/components/waves/memes/submission/hooks/useResubmissionDelete";
import { deleteDrop } from "@/services/api/signed-drop-writes";
import { ChainOperationError } from "@/lib/chain-identity/operation";

const mockWithdrawEntry = jest.fn();
const mockInvalidateChainEntryQueries = jest.fn(() => Promise.resolve());
let mockChainEntriesActive = false;
jest.mock("@/components/chain-waves/useChainEntryWriters", () => ({
  useChainEntryWriters: () =>
    mockChainEntriesActive ? { withdrawEntry: mockWithdrawEntry } : null,
  invalidateChainEntryQueries: (...args: unknown[]) =>
    mockInvalidateChainEntryQueries(...(args as [])),
}));
jest.mock("@/services/api/signed-drop-writes", () => ({
  deleteDrop: jest.fn().mockResolvedValue(undefined),
}));
const mockProcessDropRemoved = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamActionsOptional: () => ({
    processDropRemoved: mockProcessDropRemoved,
  }),
}));

const sourceDrop = {
  id: "original-drop",
  drop_type: "PARTICIPATORY",
  wave: { id: "wave-1" },
} as never;

const setup = () => {
  const requestAuth = jest.fn(async () => ({ success: true }));
  const setToast = jest.fn();
  const addOptimisticDrop = jest.fn();
  const invalidateDrops = jest.fn();
  const onClose = jest.fn();
  const onSourceDropDeleted = jest.fn();
  const client = new QueryClient();
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={{ requestAuth, setToast } as never}>
        <ReactQueryWrapperContext.Provider
          value={{ addOptimisticDrop, invalidateDrops } as never}
        >
          {children}
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  const hook = renderHook(
    () => useResubmissionDelete({ sourceDrop, onClose, onSourceDropDeleted }),
    { wrapper }
  );
  return {
    ...hook,
    requestAuth,
    setToast,
    addOptimisticDrop,
    onClose,
    onSourceDropDeleted,
  };
};

describe("useResubmissionDelete on the 6529 Network", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChainEntriesActive = true;
    mockWithdrawEntry.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockChainEntriesActive = false;
  });

  it("shows the new entry without caching a 6529.io drop for it", async () => {
    const { result, addOptimisticDrop } = setup();
    await act(async () => {
      await result.current.handleResubmissionSuccess({
        chainEntry: { entryId: "0xentry" } as never,
        title: "New version",
        metadata: [],
        pending: false,
      });
    });
    expect(result.current.replacementDrop).toEqual({
      title: "New version",
      metadata: [],
    });
    expect(addOptimisticDrop).not.toHaveBeenCalled();
  });

  it("offers no withdrawal while the new version isn't final", async () => {
    const { result, setToast, onClose } = setup();
    await act(async () => {
      await result.current.handleResubmissionSuccess({
        chainEntry: { entryId: "0xentry" } as never,
        title: "New version",
        metadata: [],
        pending: true,
      });
    });
    expect(result.current.replacementPending).toBe(true);
    expect(result.current.withdrawsOriginal).toBe(true);

    act(() => result.current.handleDeleteOriginalClick());

    expect(result.current.isDeletingOriginal).toBe(false);
    expect(mockWithdrawEntry).not.toHaveBeenCalled();
    expect(deleteDrop).not.toHaveBeenCalled();
    expect(setToast).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("withdraws the original there, with no 6529.io sign-in or delete", async () => {
    const { result, requestAuth, setToast, onClose, onSourceDropDeleted } =
      setup();
    act(() => result.current.handleDeleteOriginalClick());

    await waitFor(() => expect(onSourceDropDeleted).toHaveBeenCalled());
    expect(mockWithdrawEntry).toHaveBeenCalledWith({ dropId: "original-drop" });
    expect(deleteDrop).not.toHaveBeenCalled();
    expect(requestAuth).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith({
      message: "Original submission withdrawn.",
      type: "warning",
    });
    expect(mockProcessDropRemoved).toHaveBeenCalledWith(
      "wave-1",
      "original-drop"
    );
    expect(mockInvalidateChainEntryQueries).toHaveBeenCalledWith(
      expect.anything(),
      "wave-1"
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("says it couldn't withdraw the original when the failure has no message", async () => {
    mockWithdrawEntry.mockRejectedValue({});
    const { result } = setup();
    act(() => result.current.handleDeleteOriginalClick());

    await waitFor(() =>
      expect(result.current.deleteOriginalError).toBe(
        "Unable to withdraw the original submission."
      )
    );
  });

  it("keeps the original and says why when the withdrawal fails", async () => {
    mockWithdrawEntry.mockRejectedValue(
      new ChainOperationError(
        "rejected",
        "This decision is counting its result. Try again in a few minutes."
      )
    );
    const { result, onClose } = setup();
    act(() => result.current.handleDeleteOriginalClick());

    await waitFor(() =>
      expect(result.current.deleteOriginalError).toBe(
        "This decision is counting its result. Try again in a few minutes."
      )
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(result.current.isDeletingOriginal).toBe(false);
  });

  it("says a withdrawal refused in a block still paid its fee, in plain words", async () => {
    mockWithdrawEntry.mockRejectedValue(
      new ChainOperationError(
        "failed",
        "The 6529 Network refused this change: ENTRY_NOT_ACTIVE.",
        "ENTRY_NOT_ACTIVE"
      )
    );
    const { result } = setup();
    act(() => result.current.handleDeleteOriginalClick());

    await waitFor(() =>
      expect(result.current.deleteOriginalError).toBe(
        "The change didn't go through, and its fee was still charged. This entry is no longer in the running, so it can't be withdrawn."
      )
    );
  });
});

describe("useResubmissionDelete on 6529.io", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChainEntriesActive = false;
  });

  it("deletes the original there after the sign-in", async () => {
    const { result, requestAuth, onSourceDropDeleted } = setup();
    expect(result.current.withdrawsOriginal).toBe(false);
    expect(result.current.replacementPending).toBe(false);

    act(() => result.current.handleDeleteOriginalClick());

    await waitFor(() => expect(onSourceDropDeleted).toHaveBeenCalled());
    expect(requestAuth).toHaveBeenCalled();
    expect(deleteDrop).toHaveBeenCalledWith({
      dropId: "original-drop",
      waveId: "wave-1",
    });
    expect(mockWithdrawEntry).not.toHaveBeenCalled();
  });
});
