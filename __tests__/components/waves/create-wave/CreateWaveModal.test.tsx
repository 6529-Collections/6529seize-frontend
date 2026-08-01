import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

interface MockCreateWaveProps {
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
  readonly onSuccess: () => void;
  readonly parentWaveId?: string | null | undefined;
}

jest.mock("@/components/waves/create-wave/CreateWave", () => {
  function MockCreateWave(props: MockCreateWaveProps) {
    return (
      <div
        data-testid="create-wave"
        data-profile-handle={props.profile.handle}
        data-parent-wave-id={props.parentWaveId ?? ""}
      >
        <button type="button" onClick={props.onBack}>
          flow-back
        </button>
        <button type="button" onClick={props.onSuccess}>
          flow-success
        </button>
      </div>
    );
  }

  MockCreateWave.displayName = "MockCreateWave";

  return MockCreateWave;
});

const profile = { handle: "alice" } as ApiIdentity;

const renderModal = (
  overrides: Partial<React.ComponentProps<typeof CreateWaveModal>> = {}
) => {
  const onClose = jest.fn();
  const view = render(
    <CreateWaveModal
      isOpen
      onClose={onClose}
      profile={profile}
      {...overrides}
    />
  );
  return { onClose, ...view };
};

describe("CreateWaveModal", () => {
  it("renders nothing while closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByTestId("create-wave")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders the create-wave flow into the document body when open", () => {
    renderModal();

    const flow = screen.getByTestId("create-wave");
    expect(flow).toBeInTheDocument();
    expect(document.body).toContainElement(flow);
    expect(flow).toHaveAttribute("data-profile-handle", "alice");
  });

  it("titles the modal Create Wave for a top-level wave", () => {
    renderModal();

    expect(
      screen.getByRole("heading", { name: "Create Wave" })
    ).toBeInTheDocument();
  });

  it("titles the modal Create subwave and forwards the parent wave id", () => {
    renderModal({ parentWaveId: "wave-1" });

    expect(
      screen.getByRole("heading", { name: "Create subwave" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("create-wave")).toHaveAttribute(
      "data-parent-wave-id",
      "wave-1"
    );
  });

  it("closes when the close button is activated", async () => {
    const { onClose } = renderModal();

    await userEvent.click(screen.getByRole("button", { name: "Close modal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked but not when the panel is", async () => {
    const { onClose } = renderModal();

    await userEvent.click(screen.getByTestId("create-wave"));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("create-wave-modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the flow reports back or success", async () => {
    const { onClose } = renderModal();

    await userEvent.click(screen.getByRole("button", { name: "flow-back" }));
    await userEvent.click(screen.getByRole("button", { name: "flow-success" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
