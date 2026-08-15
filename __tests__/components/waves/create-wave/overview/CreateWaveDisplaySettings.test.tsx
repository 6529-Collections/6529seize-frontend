import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDisplaySettings from "@/components/waves/create-wave/overview/CreateWaveDisplaySettings";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { DEFAULT_PROPOSAL_CARD_RECIPE } from "@/helpers/waves/proposal-card.helpers";
import type { CreateWaveDisplayConfig } from "@/types/waves.types";

describe("CreateWaveDisplaySettings", () => {
  const openAdvancedSettings = () => {
    fireEvent.click(
      screen.getByRole("button", { name: /appearance and labels/i })
    );
  };

  const baseDisplay: CreateWaveDisplayConfig = {
    proposalCards: {
      mode: "standard",
      excerptMaxCharacters: DEFAULT_PROPOSAL_CARD_RECIPE.excerptMaxCharacters,
      showMediaThumbnail: DEFAULT_PROPOSAL_CARD_RECIPE.showMediaThumbnail,
    },
    customRules: null,
    outcomesVisible: true,
    submissionButtonLabel: null,
    approve: {
      approvalsTabLabel: "",
      approvedTabLabel: "",
    },
  };

  it("shows default approve labels in the fields", () => {
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={jest.fn()}
        waveType={ApiWaveType.Approve}
      />
    );

    openAdvancedSettings();

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

  it("switches from full proposal to the summary-card recipe", () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDisplaySettings
        display={baseDisplay}
        errors={[]}
        onChange={onChange}
        waveType={ApiWaveType.Approve}
      />
    );

    openAdvancedSettings();

    expect(screen.getByRole("radio", { name: /^Full proposal/ })).toBeChecked();
    expect(
      screen.queryByLabelText("Maximum proposal preview characters")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /^Summary card/ }));

    expect(onChange).toHaveBeenCalledWith({
      ...baseDisplay,
      proposalCards: {
        ...baseDisplay.proposalCards!,
        mode: "custom",
      },
    });
  });

  it("updates the custom recipe fields", () => {
    const onChange = jest.fn();
    const customDisplay: CreateWaveDisplayConfig = {
      ...baseDisplay,
      proposalCards: {
        mode: "custom",
        excerptMaxCharacters: 360,
        showMediaThumbnail: true,
      },
    };
    render(
      <CreateWaveDisplaySettings
        display={customDisplay}
        errors={[]}
        onChange={onChange}
        waveType={ApiWaveType.Rank}
      />
    );

    openAdvancedSettings();

    fireEvent.change(
      screen.getByLabelText("Maximum proposal preview characters"),
      {
        target: { value: "480" },
      }
    );

    expect(onChange).toHaveBeenCalledWith({
      ...customDisplay,
      proposalCards: {
        ...customDisplay.proposalCards!,
        excerptMaxCharacters: 480,
      },
    });

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /image on summary card/i,
      })
    );

    expect(onChange).toHaveBeenLastCalledWith({
      ...customDisplay,
      proposalCards: {
        ...customDisplay.proposalCards!,
        showMediaThumbnail: false,
      },
    });
  });

  it("associates an invalid summary text limit with its recovery message", () => {
    render(
      <CreateWaveDisplaySettings
        display={{
          ...baseDisplay,
          proposalCards: {
            mode: "custom",
            excerptMaxCharacters: 0,
            showMediaThumbnail: true,
          },
        }}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.PROPOSAL_CARD_EXCERPT_LENGTH_INVALID,
        ]}
        onChange={jest.fn()}
        waveType={ApiWaveType.Rank}
      />
    );

    openAdvancedSettings();

    const input = screen.getByLabelText("Maximum proposal preview characters");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Enter a whole number from 120 to 1000."
    );
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
