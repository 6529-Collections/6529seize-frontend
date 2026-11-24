import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useMutation } from "@tanstack/react-query";
import { AppToastContent } from "@/components/utils/toast/AppToast";
import { ChainOperationError } from "@/lib/chain-identity/operation";

jest.mock("@tanstack/react-query");
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamActions: () => ({ processDropRemoved: jest.fn() }),
}));
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

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const useMutationMock = useMutation as jest.Mock;

describe("DropsListItemDeleteDropModal", () => {
  const auth = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  } as any;
  const rq = { invalidateDrops: jest.fn() } as any;
  const mutateAsync = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    useMutationMock.mockImplementation((opts) => {
      return {
        mutateAsync: async () => {
          await opts.mutationFn();
          opts.onSuccess?.();
          opts.onSettled?.();
          return mutateAsync();
        },
      };
    });
  });

  const drop = {
    id: "d1",
    drop_type: ApiDropType.Participatory,
    wave: { id: "w" },
  } as any;

  const renderModal = (props: { onDropDeleted?: () => void } = {}) =>
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <DropsListItemDeleteDropModal
            drop={drop}
            closeModal={jest.fn()}
            onDropDeleted={props.onDropDeleted}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

  it("renders above the mobile drop detail layer as an accessible dialog", async () => {
    renderModal();

    const dialog = screen.getByRole("dialog", { name: "Delete Drop" });
    expect(dialog).toHaveClass("tw-z-[1020]");
    expect(dialog).toHaveAccessibleDescription(
      "Are you sure you want to delete this drop?"
    );
    expect(screen.getByRole("heading", { name: "Delete Drop" })).toHaveClass(
      "tw-m-0",
      "tw-leading-6"
    );
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "tw-h-10",
      "tw-text-sm"
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass(
      "tw-h-10",
      "tw-text-sm"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus()
    );
  });

  it("deletes drop after confirmation", async () => {
    const onDropDeleted = jest.fn();
    const user = userEvent.setup();
    renderModal({ onDropDeleted });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onDropDeleted).toHaveBeenCalled());
    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
    expect(auth.setToast).toHaveBeenCalledWith({
      message: "Drop deleted.",
      type: "warning",
    });
    expect(rq.invalidateDrops).toHaveBeenCalled();
  });

  it("shows no error when the delete was cancelled at the signing prompt", async () => {
    const { SignedWriteCancelledError } = jest.requireActual(
      "@/lib/device-signing/signing-decision"
    );
    const cancelled = new SignedWriteCancelledError();
    useMutationMock.mockImplementationOnce((opts) => ({
      mutateAsync: async () => {
        opts.onError?.(cancelled);
        opts.onSettled?.();
        throw cancelled;
      },
    }));
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled()
    );
    expect(auth.setToast).not.toHaveBeenCalled();
  });

  it("shows a recoverable error when deletion fails", async () => {
    const error = new Error("Delete failed");
    useMutationMock.mockImplementationOnce((opts) => ({
      mutateAsync: async () => {
        opts.onError?.(error);
        opts.onSettled?.();
        throw error;
      },
    }));
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(auth.setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't delete this drop.",
          description: "Please try again.",
        })
      )
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  describe("on the 6529 Network", () => {
    const { deleteDrop } = jest.requireMock(
      "@/services/api/signed-drop-writes"
    );

    beforeEach(() => {
      mockChainEntriesActive = true;
      mockWithdrawEntry.mockResolvedValue(undefined);
    });

    afterEach(() => {
      mockChainEntriesActive = false;
    });

    it("withdraws the author's entry there, with no 6529.io sign-in or delete", async () => {
      const onDropDeleted = jest.fn();
      const user = userEvent.setup();
      renderModal({ onDropDeleted });

      expect(
        screen.getByRole("dialog", { name: "Withdraw Entry" })
      ).toHaveAccessibleDescription(
        "Withdraw this entry from the decision? You can't undo this."
      );
      await user.click(screen.getByRole("button", { name: "Withdraw" }));

      await waitFor(() => expect(onDropDeleted).toHaveBeenCalled());
      expect(mockWithdrawEntry).toHaveBeenCalledWith({ dropId: "d1" });
      expect(deleteDrop).not.toHaveBeenCalled();
      expect(auth.requestAuth).not.toHaveBeenCalled();
      expect(auth.setToast).toHaveBeenCalledWith({
        message: "Entry withdrawn.",
        type: "warning",
      });
      expect(mockInvalidateChainEntryQueries).toHaveBeenCalledWith(
        undefined,
        "w"
      );
    });

    it("says the network's reason for a refused withdrawal, with no second line", async () => {
      const refusal = new ChainOperationError(
        "failed",
        "The 6529 Network refused this change: ENTRY_NOT_ACTIVE.",
        "ENTRY_NOT_ACTIVE"
      );
      useMutationMock.mockImplementation((opts) => ({
        mutateAsync: async () => {
          opts.onError?.(refusal);
          opts.onSettled?.();
          throw refusal;
        },
      }));
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole("button", { name: "Withdraw" }));

      await waitFor(() => expect(auth.setToast).toHaveBeenCalled());
      const toast = auth.setToast.mock.calls[0][0];
      expect(toast.details).toBeUndefined();
      // As 6529.io shows it, through its own toast helpers.
      const shown = render(<AppToastContent toast={toast} />).container;
      expect(shown).toHaveTextContent("Couldn't withdraw this entry.");
      expect(shown).toHaveTextContent(
        "The change didn't go through, and its fee was still charged. This entry is no longer in the running, so it can't be withdrawn."
      );
      expect(shown).not.toHaveTextContent(
        /Network error|Wallet error|Please try again/
      );
    });

    it("keeps deleting chat drops on 6529.io", async () => {
      const user = userEvent.setup();
      render(
        <AuthContext.Provider value={auth}>
          <ReactQueryWrapperContext.Provider value={rq}>
            <DropsListItemDeleteDropModal
              drop={{ ...drop, drop_type: ApiDropType.Chat }}
              closeModal={jest.fn()}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      );

      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(deleteDrop).toHaveBeenCalled());
      expect(auth.requestAuth).toHaveBeenCalled();
      expect(mockWithdrawEntry).not.toHaveBeenCalled();
    });
  });
});
