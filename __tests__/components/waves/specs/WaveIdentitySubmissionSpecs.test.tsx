import { render, screen } from "@testing-library/react";
import WaveIdentitySubmissionSpecs from "@/components/waves/specs/WaveIdentitySubmissionSpecs";
import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";

describe("WaveIdentitySubmissionSpecs", () => {
  const baseWave: any = {
    participation: {
      submission_strategy: null,
    },
  };

  it("renders compact identity submission summaries when configured", () => {
    render(
      <WaveIdentitySubmissionSpecs
        wave={{
          ...baseWave,
          participation: {
            submission_strategy: {
              type: ApiWaveParticipationSubmissionStrategyType.Identity,
              config: {
                who_can_be_submitted:
                  ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
                duplicates:
                  ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin,
              },
            },
          },
        }}
        useRing={false}
      />
    );

    expect(screen.getByText("Identity submissions")).toBeInTheDocument();
    expect(screen.getByText("Eligible identities")).toBeInTheDocument();
    expect(screen.getByText("Others only")).toBeInTheDocument();
    expect(screen.getByText("Repeat submissions")).toBeInTheDocument();
    expect(screen.getByText("After it wins")).toBeInTheDocument();
  });

  it("renders nothing when the wave is not identity-based", () => {
    const { container } = render(
      <WaveIdentitySubmissionSpecs wave={baseWave} />
    );
    expect(container.firstChild).toBeNull();
  });
});
