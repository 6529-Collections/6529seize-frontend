import MessagesDesktop from "@/components/messages/MessagesDesktop";
import { useWaveDeleteFlow } from "@/components/waves/header/options/delete/WaveDeleteFlowContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

const mockWaveDeleteModal = jest.fn(
  ({ isOpen }: { readonly isOpen: boolean }) =>
    isOpen ? <div data-testid="delete-wave-modal" /> : null
);

jest.mock("@/components/brain/ContentTabContext", () => ({
  ContentTabProvider: ({ children }: { readonly children: ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/components/shared/WavesMessagesWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => (
    <div data-testid="messages-wrapper">{children}</div>
  ),
}));

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("@/components/waves/header/options/delete/WaveDeleteModal", () => ({
  __esModule: true,
  default: (props: { readonly isOpen: boolean }) => mockWaveDeleteModal(props),
}));

const wave = { id: "dm-wave" } as ApiWave;

function DeleteFlowConsumer() {
  const { requestDelete } = useWaveDeleteFlow();

  return (
    <button type="button" onClick={() => requestDelete(wave)}>
      Delete DM
    </button>
  );
}

describe("MessagesDesktop", () => {
  it("provides the wave deletion flow to message sidebar actions", async () => {
    const user = userEvent.setup();

    render(
      <MessagesDesktop>
        <DeleteFlowConsumer />
      </MessagesDesktop>
    );

    expect(screen.getByTestId("messages-wrapper")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete DM" }));

    expect(screen.getByTestId("delete-wave-modal")).toBeInTheDocument();
    expect(mockWaveDeleteModal).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: true, wave })
    );
  });
});
