import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDisplaySettings from "@/components/waves/create-wave/overview/CreateWaveDisplaySettings";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

describe("CreateWaveDisplaySettings", () => {
  const baseDisplay = {
    customRules: null,
    outcomesVisible: true,
    approve: {
      approvalsTabLabel: "",
      approvedTabLabel: "",
    },
  };

  it("shows default approve labels in the preview", () => {
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={jest.fn()}
        waveType={ApiWaveType.Approve}
      />
    );

    expect(screen.getByText("Proposals")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Proposals")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Approved")).toBeInTheDocument();
  });

  it("updates custom label fields", () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={onChange}
        waveType={ApiWaveType.Approve}
      />
    );

    fireEvent.change(screen.getByLabelText("Approvals tab label"), {
      target: { value: "Candidates" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...baseDisplay,
      approve: {
        approvalsTabLabel: "Candidates",
        approvedTabLabel: "",
      },
    });
  });

  it("shows outcome toggle for rank waves without approve labels", () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={onChange}
        waveType={ApiWaveType.Rank}
      />
    );

    expect(screen.getByText("Show outcomes")).toBeInTheDocument();
    expect(screen.queryByLabelText("Approvals tab label")).toBeNull();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalledWith({
      ...baseDisplay,
      outcomesVisible: false,
    });
  });

  it("shows duplicate label validation", () => {
    render(
      <CreateWaveDisplaySettings
        display={{
          ...baseDisplay,
          approve: {
            approvalsTabLabel: "Selected",
            approvedTabLabel: "Selected",
          },
        }}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABELS_DUPLICATE,
        ]}
        onChange={jest.fn()}
        waveType={ApiWaveType.Approve}
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
          ...baseDisplay,
          approve: {
            approvalsTabLabel: "Chat",
            approvedTabLabel: "Selected",
          },
        }}
        errors={[CREATE_WAVE_VALIDATION_ERROR.APPROVE_WAVE_TAB_LABEL_RESERVED]}
        onChange={jest.fn()}
        waveType={ApiWaveType.Approve}
      />
    );

    expect(
      screen.getByText("Labels cannot match existing tabs.")
    ).toBeInTheDocument();
  });
});
