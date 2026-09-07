import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import type { CreateWaveDropsConfig } from "@/types/waves.types";
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

const getDrops = (terms: string | null = null): CreateWaveDropsConfig => ({
  noOfApplicationsAllowedPerParticipant: null,
  requiredTypes: [],
  requiredMetadata: [],
  submissionStrategy: null,
  terms,
  signatureRequired: Boolean(terms),
  adminCanDeleteDrops: false,
});

function StatefulDrops({ waveType }: { readonly waveType: ApiWaveType }) {
  const [drops, setDrops] = useState(() => getDrops());
  return (
    <CreateWaveDrops
      waveType={waveType}
      drops={drops}
      errors={[]}
      setDrops={setDrops}
    />
  );
}

describe("CreateWaveDrops", () => {
  it("updates drops config based on user input", async () => {
    const user = userEvent.setup();
    const setDrops = jest.fn();
    render(
      <CreateWaveDrops
        waveType={ApiWaveType.Rank}
        drops={getDrops()}
        errors={[]}
        setDrops={setDrops}
      />
    );
    await user.click(
      screen.getByRole("button", { name: "Submission requirements" })
    );
    await user.type(
      screen.getByLabelText(/Max simultaneous submissions/i),
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
  });

  it.each([ApiWaveType.Rank, ApiWaveType.Approve])(
    "keeps signing rules in Submission requirements and reflects edits in its badge for %s",
    (waveType) => {
      render(<StatefulDrops waveType={waveType} />);
      const disclosure = screen.getByRole("button", {
        name: "Submission requirements",
      });
      expect(
        screen.queryByRole("textbox", { name: "Rules that require acceptance" })
      ).toBeNull();
      fireEvent.click(disclosure);
      const rules = screen.getByRole("textbox", {
        name: "Rules that require acceptance",
      });
      expect(rules).toBeVisible();
      fireEvent.change(rules, { target: { value: "Binding rule" } });
      expect(disclosure).toHaveTextContent("Customized");
      fireEvent.click(disclosure);
      expect(rules).not.toBeVisible();
      expect(disclosure).toHaveTextContent("Customized");
      fireEvent.click(disclosure);
      expect(rules).toHaveValue("Binding rule");
      fireEvent.change(rules, { target: { value: "" } });
      expect(disclosure).not.toHaveTextContent("Customized");
    }
  );

  it.each([
    ["Binding rule", true],
    ["", false],
    ["  \n  ", false],
  ] as const)(
    "sets signing from entered rules (%j)",
    (terms, signatureRequired) => {
      const setDrops = jest.fn();
      const drops = getDrops("Restored rules");
      render(
        <CreateWaveDrops
          waveType={ApiWaveType.Rank}
          drops={drops}
          errors={[]}
          setDrops={setDrops}
        />
      );
      const disclosure = screen.getByRole("button", {
        name: "Submission requirements Customized",
      });
      fireEvent.click(disclosure);
      const rules = screen.getByRole("textbox", {
        name: "Rules that require acceptance",
      });
      expect(rules).toHaveValue("Restored rules");
      fireEvent.change(rules, { target: { value: terms } });
      expect(setDrops).toHaveBeenCalledWith({
        ...drops,
        terms,
        signatureRequired,
      });
    }
  );

  it("does not offer signing rules for Chat waves", () => {
    render(<StatefulDrops waveType={ApiWaveType.Chat} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Submission requirements" })
    );
    expect(
      screen.queryByRole("textbox", { name: "Rules that require acceptance" })
    ).toBeNull();
  });
});
