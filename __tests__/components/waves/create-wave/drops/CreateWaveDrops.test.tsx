import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveDrops from "@/components/waves/create-wave/drops/CreateWaveDrops";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock(
  "@/components/waves/create-wave/drops/types/CreateWaveDropsTypes",
  () => (props: any) => (
    <div
      data-testid="types"
      onClick={() => props.onRequiredTypeChange(["A"])}
    />
  )
);

jest.mock(
  "@/components/waves/create-wave/drops/submission-mode/CreateWaveDropsSubmissionMode",
  () => (props: any) => (
    <button
      data-testid="submission-mode"
      onClick={() =>
        props.onChange({
          type: "IDENTITY",
          config: {
            duplicates: "NEVER_ALLOW",
            who_can_be_submitted: "EVERYONE",
          },
        })
      }
    />
  )
);

jest.mock(
  "@/components/waves/create-wave/drops/metadata/CreateWaveDropsMetadata",
  () => (props: any) => (
    <div
      data-testid="metadata"
      onClick={() => props.onRequiredMetadataChange([{ foo: "bar" }])}
    />
  )
);

jest.mock(
  "@/components/waves/create-wave/drops/terms/CreateWaveTermsOfService",
  () => (props: any) => (
    <button onClick={() => props.setTerms("terms")} data-testid="terms" />
  )
);

describe("CreateWaveDrops", () => {
  it("updates drops config based on user input", async () => {
    const user = userEvent.setup();
    const setDrops = jest.fn();
    render(
      <CreateWaveDrops
        waveType={ApiWaveType.Rank}
        drops={{
          noOfApplicationsAllowedPerParticipant: null,
          requiredTypes: [],
          requiredMetadata: [],
          submissionStrategy: null,
          terms: null,
          signatureRequired: false,
          adminCanDeleteDrops: false,
        }}
        errors={[]}
        setDrops={setDrops}
      />
    );
    await user.type(
      screen.getByLabelText(/Maximum number of simultaneous submissions/i),
      "3"
    );
    expect(setDrops).toHaveBeenLastCalledWith(
      expect.objectContaining({ noOfApplicationsAllowedPerParticipant: 3 })
    );

    await user.click(screen.getByTestId("submission-mode"));
    expect(setDrops).toHaveBeenLastCalledWith(
      expect.objectContaining({
        submissionStrategy: expect.objectContaining({
          type: ApiWaveParticipationSubmissionStrategyType.Identity,
        }),
      })
    );

    await user.click(screen.getByTestId("types"));
    expect(setDrops).toHaveBeenLastCalledWith(
      expect.objectContaining({ requiredTypes: ["A"] })
    );

    await user.click(screen.getByTestId("metadata"));
    expect(setDrops).toHaveBeenLastCalledWith(
      expect.objectContaining({ requiredMetadata: [{ foo: "bar" }] })
    );

    await user.click(screen.getByTestId("terms"));
    expect(setDrops).toHaveBeenLastCalledWith(
      expect.objectContaining({ terms: "terms", signatureRequired: true })
    );
  });
});
