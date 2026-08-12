import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDisplaySettings from "@/components/waves/create-wave/overview/CreateWaveDisplaySettings";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

describe("CreateWaveDisplaySettings", () => {
  const baseDisplay = {
    customRules: null,
    outcomesVisible: true,
    submissionButtonLabel: null,
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
    expect(screen.getByPlaceholderText("Drop")).toBeInTheDocument();
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

  it("updates the submission button label field", () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={onChange}
        waveType={ApiWaveType.Rank}
      />
    );

    fireEvent.change(screen.getByLabelText("Submission button label"), {
      target: { value: "Apply" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...baseDisplay,
      submissionButtonLabel: "Apply",
    });
  });

  it("stores an empty submission button label as null", () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDisplaySettings
        display={{
          ...baseDisplay,
          submissionButtonLabel: "Apply",
        }}
        errors={[]}
        onChange={onChange}
        waveType={ApiWaveType.Rank}
      />
    );

    fireEvent.change(screen.getByLabelText("Submission button label"), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...baseDisplay,
      submissionButtonLabel: null,
    });
  });

  it("shows submission label length validation", () => {
    render(
      <CreateWaveDisplaySettings
        display={{
          ...baseDisplay,
          submissionButtonLabel: "A".repeat(25),
        }}
        errors={[CREATE_WAVE_VALIDATION_ERROR.SUBMISSION_BUTTON_LABEL_TOO_LONG]}
        onChange={jest.fn()}
        waveType={ApiWaveType.Rank}
      />
    );

    expect(
      screen.getByText("Label must be 24 characters or fewer.")
    ).toBeInTheDocument();
  });

  it("hides approve labels and the outcome toggle for rank waves", () => {
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={jest.fn()}
        waveType={ApiWaveType.Rank}
      />
    );

    // The outcomes-visibility toggle lives on the Outcomes step now.
    expect(screen.queryByText("Show outcomes")).toBeNull();
    expect(screen.queryByLabelText("Approvals tab label")).toBeNull();
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
