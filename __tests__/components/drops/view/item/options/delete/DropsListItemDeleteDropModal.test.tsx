import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useMutation } from "@tanstack/react-query";

jest.mock("@tanstack/react-query");
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ processDropRemoved: jest.fn() }),
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
});
