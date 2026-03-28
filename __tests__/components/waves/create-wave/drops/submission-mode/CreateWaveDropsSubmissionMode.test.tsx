import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveDropsSubmissionMode from "@/components/waves/create-wave/drops/submission-mode/CreateWaveDropsSubmissionMode";
import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";

describe("CreateWaveDropsSubmissionMode", () => {
  it("renders clearer identity nomination copy", () => {
    render(
      <CreateWaveDropsSubmissionMode
        submissionStrategy={{
          type: ApiWaveParticipationSubmissionStrategyType.Identity,
          config: {
            duplicates:
              ApiWaveParticipationIdentitySubmissionAllowDuplicates.NeverAllow,
            who_can_be_submitted:
              ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone,
          },
        }}
        errors={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText("Submission type")).toBeInTheDocument();
    expect(screen.getByText("Standard drops")).toBeInTheDocument();
    expect(screen.getByText("Identity nominations")).toBeInTheDocument();
    expect(
      screen.getByText("Which identities can a participant submit?")
    ).toBeInTheDocument();
    expect(screen.getByText("Own identity only")).toBeInTheDocument();
    const ownIdentityDescription = screen.getByText(
      "A participant can submit only themselves."
    );
    expect(ownIdentityDescription).toBeInTheDocument();
    expect(ownIdentityDescription.closest("label")).toBeInTheDocument();
    expect(ownIdentityDescription).toHaveAttribute(
      "id",
      "who-can-be-submitted-only_myself-description"
    );
    expect(
      screen.getByRole("radio", { name: "Own identity only" })
    ).toHaveAttribute(
      "aria-describedby",
      "who-can-be-submitted-only_myself-description"
    );
    expect(
      screen.getByText("When can the same identity be submitted again?")
    ).toBeInTheDocument();
    expect(screen.getByText("Never again")).toBeInTheDocument();
    const neverAgainDescription = screen.getByText(
      "The same identity can be submitted only once, even after a win."
    );
    expect(neverAgainDescription).toBeInTheDocument();
    expect(neverAgainDescription.closest("label")).toBeInTheDocument();
    expect(neverAgainDescription).toHaveAttribute(
      "id",
      "duplicate-submissions-never_allow-description"
    );
    expect(screen.getByRole("radio", { name: "Never again" })).toHaveAttribute(
      "aria-describedby",
      "duplicate-submissions-never_allow-description"
    );
  });

  it("updates nomination rules when a new option is selected", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <CreateWaveDropsSubmissionMode
        submissionStrategy={{
          type: ApiWaveParticipationSubmissionStrategyType.Identity,
          config: {
            duplicates:
              ApiWaveParticipationIdentitySubmissionAllowDuplicates.NeverAllow,
            who_can_be_submitted:
              ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone,
          },
        }}
        errors={[]}
        onChange={onChange}
      />
    );

    await user.click(
      screen.getByText(
        "A participant can submit someone else, but not themselves."
      )
    );
    expect(onChange).toHaveBeenLastCalledWith({
      type: ApiWaveParticipationSubmissionStrategyType.Identity,
      config: {
        duplicates:
          ApiWaveParticipationIdentitySubmissionAllowDuplicates.NeverAllow,
        who_can_be_submitted:
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
      },
    });

    await user.click(screen.getByRole("radio", { name: "After it wins" }));
    expect(onChange).toHaveBeenLastCalledWith({
      type: ApiWaveParticipationSubmissionStrategyType.Identity,
      config: {
        duplicates:
          ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin,
        who_can_be_submitted:
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone,
      },
    });
  });
});
