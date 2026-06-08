import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDisplaySettings from "@/components/waves/create-wave/overview/CreateWaveDisplaySettings";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

describe("CreateWaveDisplaySettings", () => {
  const baseDisplay = {
    approvalsTabLabel: "",
    approvedTabLabel: "",
  };

  it("shows default approve labels in the preview", () => {
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Approvals")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Approved")).toBeInTheDocument();
  });

  it("updates custom label fields", () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Approvals tab label"), {
      target: { value: "Candidates" },
    });

    expect(onChange).toHaveBeenCalledWith({
      approvalsTabLabel: "Candidates",
      approvedTabLabel: "",
    });
  });

  it("shows duplicate label validation", () => {
    render(
      <CreateWaveDisplaySettings
        display={{
          approvalsTabLabel: "Selected",
          approvedTabLabel: "Selected",
        }}
        errors={[CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABELS_DUPLICATE]}
        onChange={jest.fn()}
      />
    );

    expect(
      screen.getByText("Use two different tab labels.")
    ).toBeInTheDocument();
  });

  it("shows reserved label validation", () => {
    render(
      <CreateWaveDisplaySettings
        display={{
          approvalsTabLabel: "Chat",
          approvedTabLabel: "Selected",
        }}
        errors={[CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_RESERVED]}
        onChange={jest.fn()}
      />
    );

    expect(
      screen.getByText("Labels cannot match existing tabs.")
    ).toBeInTheDocument();
  });
});
