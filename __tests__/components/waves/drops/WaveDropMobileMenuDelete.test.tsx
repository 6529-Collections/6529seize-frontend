import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropMobileMenuDelete from "@/components/waves/drops/WaveDropMobileMenuDelete";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { deleteDrop } from "@/services/api/signed-drop-writes";
import { AppToastContent } from "@/components/utils/toast/AppToast";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { ChainEntryPendingError } from "@/lib/chain-waves/entryWriters";

jest.mock("framer-motion", () => ({
  motion: {
    button: (p: any) => <button {...p} />,
    div: (p: any) => <div {...p} />,
  },
  AnimatePresence: (p: any) => <div>{p.children}</div>,
}));

const mockQueryClient = { invalidateQueries: jest.fn() };
jest.mock("@tanstack/react-query", () => ({
  useMutation: (config: any) => {
    return {
      mutateAsync: async () => {
        try {
          await config.mutationFn();
          config.onSuccess?.();
        } catch (error) {
          config.onError?.(error);
          throw error;
        } finally {
          config.onSettled?.();
        }
      },
    };
  },
  useQueryClient: () => mockQueryClient,
}));

const mockProcessDropRemoved = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamActions: () => ({ processDropRemoved: mockProcessDropRemoved }),
}));
jest.mock("@/services/api/signed-drop-writes", () => ({
  deleteDrop: jest.fn(),
}));
const mockWithdrawEntry = jest.fn();
const mockInvalidateChainEntryQueries = jest.fn();
let mockChainEntriesActive = false;
jest.mock("@/components/chain-waves/useChainEntryWriters", () => ({
  useChainEntryWriters: () =>
    mockChainEntriesActive ? { withdrawEntry: mockWithdrawEntry } : null,
  invalidateChainEntryQueries: (...args: unknown[]) =>
    mockInvalidateChainEntryQueries(...args),
}));

describe("WaveDropMobileMenuDelete", () => {
  const drop = {
    id: "1",
    drop_type: ApiDropType.Participatory,
    wave: { id: "w" },
  } as any;
  const invalidateDrops = jest.fn();
  const setToast = jest.fn();
  const onDropDeleted = jest.fn();
  const requestAuth = jest.fn();

  function renderComponent(authSuccess = true, shown = drop) {
    requestAuth.mockResolvedValue({ success: authSuccess });
    return render(
      <AuthContext.Provider value={{ requestAuth, setToast } as any}>
        <ReactQueryWrapperContext.Provider value={{ invalidateDrops } as any}>
          <WaveDropMobileMenuDelete
            drop={shown}
            onDropDeleted={onDropDeleted}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(deleteDrop).mockResolvedValue(undefined as never);
    mockWithdrawEntry.mockResolvedValue(undefined);
    mockInvalidateChainEntryQueries.mockResolvedValue(undefined);
  });

  it("toggles delete mode and confirms deletion", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText("Delete"));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    await user.click(screen.getByText("Are you sure?"));
    await waitFor(() => expect(onDropDeleted).toHaveBeenCalled());
    expect(deleteDrop).toHaveBeenCalledWith({ dropId: "1", waveId: "w" });
    expect(setToast).toHaveBeenCalledWith({
      message: "Drop deleted.",
      type: "warning",
    });
  });

  it("does not delete when auth fails", async () => {
    const user = userEvent.setup();
    renderComponent(false);
    await user.click(screen.getByText("Delete"));
    await user.click(screen.getByText("Are you sure?"));
    await waitFor(() => expect(requestAuth).toHaveBeenCalled());
    expect(deleteDrop).not.toHaveBeenCalled();
  });

  describe("on the 6529 Network", () => {
    beforeEach(() => {
      mockChainEntriesActive = true;
    });

    afterEach(() => {
      mockChainEntriesActive = false;
    });

    it("withdraws the author's entry there, with no 6529.io sign-in or delete", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText("Withdraw"));
      await user.click(screen.getByText("Are you sure?"));

      await waitFor(() => expect(onDropDeleted).toHaveBeenCalled());
      expect(mockWithdrawEntry).toHaveBeenCalledWith({ dropId: "1" });
      expect(deleteDrop).not.toHaveBeenCalled();
      expect(requestAuth).not.toHaveBeenCalled();
      expect(setToast).toHaveBeenCalledWith({
        message: "Entry withdrawn.",
        type: "warning",
      });
      expect(mockInvalidateChainEntryQueries).toHaveBeenCalledWith(
        mockQueryClient,
        "w"
      );
      expect(mockProcessDropRemoved).toHaveBeenCalledWith("w", "1");
    });

    it("says why the withdrawal failed, in the network's words", async () => {
      mockWithdrawEntry.mockRejectedValue(
        new ChainOperationError(
          "rejected",
          "This wallet has no identity on the 6529 Network yet."
        )
      );
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText("Withdraw"));
      await user.click(screen.getByText("Are you sure?"));

      await waitFor(() =>
        expect(setToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            title: "Couldn't withdraw this entry.",
            description: "This wallet has no identity on the 6529 Network yet.",
            details: undefined,
          })
        )
      );
      // As 6529.io shows it, through its own toast helpers.
      const shown = render(
        <AppToastContent toast={setToast.mock.calls.at(-1)?.[0]} />
      ).container;
      expect(shown).toHaveTextContent(
        "This wallet has no identity on the 6529 Network yet."
      );
      expect(shown).not.toHaveTextContent(
        /Network error|Wallet error|Please try again/
      );
      expect(onDropDeleted).not.toHaveBeenCalled();
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });

    it("says a withdrawal that isn't final yet was sent", async () => {
      mockWithdrawEntry.mockRejectedValue(
        new ChainEntryPendingError(
          "Your withdrawal was sent to the 6529 Network but isn't final yet. Check again in a few minutes.",
          null
        )
      );
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText("Withdraw"));
      await user.click(screen.getByText("Are you sure?"));

      await waitFor(() =>
        expect(setToast).toHaveBeenCalledWith({
          message:
            "Your withdrawal was sent to the 6529 Network but isn't final yet. Check again in a few minutes.",
          type: "warning",
        })
      );
      expect(setToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
    });

    it("stays quiet when the wallet prompt is declined", async () => {
      mockWithdrawEntry.mockRejectedValue(
        Object.assign(new Error("User rejected"), { code: 4001 })
      );
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText("Withdraw"));
      await user.click(screen.getByText("Are you sure?"));

      await waitFor(() => expect(mockWithdrawEntry).toHaveBeenCalled());
      await waitFor(() =>
        expect(screen.getByText("Are you sure?")).toBeInTheDocument()
      );
      expect(setToast).not.toHaveBeenCalled();
      expect(onDropDeleted).not.toHaveBeenCalled();
    });

    it("keeps deleting chat drops on 6529.io", async () => {
      const user = userEvent.setup();
      renderComponent(true, { ...drop, drop_type: ApiDropType.Chat });

      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByText("Are you sure?"));

      await waitFor(() => expect(deleteDrop).toHaveBeenCalled());
      expect(requestAuth).toHaveBeenCalled();
      expect(mockWithdrawEntry).not.toHaveBeenCalled();
    });
  });
});
