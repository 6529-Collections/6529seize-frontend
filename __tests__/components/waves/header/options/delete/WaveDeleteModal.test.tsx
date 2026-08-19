import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import WaveDeleteModal from "@/components/waves/header/options/delete/WaveDeleteModal";
import { AuthContext } from "@/components/auth/Auth";
jest.mock("@/services/api/common-api", () => ({ commonApiDelete: jest.fn() }));
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ReactQueryWrapperContextType } from "@/components/react-query-wrapper/ReactQueryWrapperContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

jest.mock("@tanstack/react-query");
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

const useMutationMock = useMutation as jest.Mock;
const useRouterMock = useRouter as jest.Mock;

describe("WaveDeleteModal", () => {
  const auth = createMockAuthContext({
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  });
  const rq = {
    invalidateDrops: jest.fn(),
  } as unknown as ReactQueryWrapperContextType;
  const push = jest.fn();
  const mutate = jest.fn();

  beforeEach(() => {
    useRouterMock.mockReturnValue({ push });
    useMutationMock.mockImplementation((opts) => ({
      mutate: () => {
        void opts.mutationFn();
        opts.onSuccess?.();
        opts.onSettled?.();
        mutate();
      },
    }));
  });

  it("deletes wave and navigates away", async () => {
    const user = userEvent.setup();
    const wave = { id: "w1" } as ApiWave;
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveDeleteModal wave={wave} isOpen closeModal={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    expect(screen.getByRole("dialog", { name: "Delete wave" })).toHaveAttribute(
      "aria-modal",
      "true"
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutate).toHaveBeenCalled();
    expect(auth.setToast).toHaveBeenCalledWith({
      message: "Wave deleted.",
      type: "warning",
    });
    expect(rq.invalidateDrops).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/waves");
  });

  it("contains focus and restores it to the opener", async () => {
    const user = userEvent.setup();
    const wave = { id: "w1" } as ApiWave;

    function Harness() {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open confirmation
          </button>
          <WaveDeleteModal
            wave={wave}
            isOpen={isOpen}
            closeModal={() => setIsOpen(false)}
          />
        </>
      );
    }

    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <Harness />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    const opener = screen.getByRole("button", { name: "Open confirmation" });
    await user.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Delete wave" });
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement)
    );

    await user.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
