import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveRules from "@/components/waves/create-wave/CreateWaveRules";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveConfig } from "@/types/waves.types";

const getConfig = (
  type: ApiWaveType,
  customRules: string | null = null
): CreateWaveConfig => ({
  overview: {
    type,
    typeSelected: true,
    name: "Rules test wave",
    image: null,
  },
  groups: {
    canView: null,
    canDrop: null,
    canVote: null,
    canChat: null,
    admin: null,
  },
  dates: {
    submissionStartDate: 0,
    votingStartDate: 0,
    endDate: null,
    firstDecisionTime: 0,
    subsequentDecisions: [],
    isRolling: false,
  },
  drops: {
    noOfApplicationsAllowedPerParticipant: null,
    requiredTypes: [],
    requiredMetadata: [],
    submissionStrategy: null,
    terms: null,
    signatureRequired: false,
    adminCanDeleteDrops: true,
  },
  chat: { enabled: true },
  voting: {
    type: null,
    creditScope: ApiWaveCreditScope.Wave,
    category: null,
    profileId: null,
    creditNfts: [],
    creditNftMemeCount: null,
    allowNegativeVotes: false,
    maxVotesPerIdentityPerDrop: null,
    winningThreshold: null,
    timeWeighted: {
      enabled: false,
      averagingInterval: 24,
      averagingIntervalUnit: "hours",
    },
  },
  outcomes: [],
  approval: {
    threshold: null,
    thresholdTimeMs: null,
    maxWinners: null,
  },
  display: {
    customRules,
    outcomesVisible: true,
    submissionButtonLabel: null,
    approve: {
      approvalsTabLabel: "",
      approvedTabLabel: "",
    },
  },
});

describe("CreateWaveRules", () => {
  it("shows Chat wave guidelines without a configuration summary", () => {
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Chat)}
        setDisplay={jest.fn()}
        setDrops={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Rules" })
    ).toBeVisible();
    expect(screen.queryByTestId("rules-panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Automatic rules")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Automatic rules are generated from the wave setup. Add creator rules only for wave-specific requirements that are not already covered."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Wave guidelines" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Wave guidelines" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Rules that require acceptance" })
    ).toBeNull();

    expect(
      screen.getByRole("textbox", { name: "Wave guidelines" })
    ).toBeVisible();
    expect(
      screen.getByText("These guidelines are shown in wave rules panel")
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText("Add optional wave guidelines...")
    ).toBeVisible();
    expect(
      screen.queryByText("Display-only creator rules")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Leave blank when automatic rules already cover the wave."
      )
    ).not.toBeInTheDocument();
  });

  it.each([ApiWaveType.Rank, ApiWaveType.Approve])(
    "requires signing when rules are entered for %s waves",
    (waveType) => {
      const setDrops = jest.fn();
      render(
        <CreateWaveRules
          config={getConfig(waveType)}
          setDisplay={jest.fn()}
          setDrops={setDrops}
        />
      );

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      fireEvent.change(
        screen.getByRole("textbox", { name: "Rules that require acceptance" }),
        { target: { value: "Binding rule" } }
      );

      expect(setDrops).toHaveBeenCalledWith(
        expect.objectContaining({
          terms: "Binding rule",
          signatureRequired: true,
        })
      );
    }
  );

  it.each(["", "  \n  "])(
    "disables signing when acceptance rules become blank (%j)",
    (terms) => {
      const setDrops = jest.fn();
      const config = getConfig(ApiWaveType.Rank);
      config.drops.terms = "Binding rule";
      config.drops.signatureRequired = true;
      render(
        <CreateWaveRules
          config={config}
          setDisplay={jest.fn()}
          setDrops={setDrops}
        />
      );

      fireEvent.change(
        screen.getByRole("textbox", { name: "Rules that require acceptance" }),
        { target: { value: terms } }
      );

      expect(setDrops).toHaveBeenCalledWith(
        expect.objectContaining({ terms, signatureRequired: false })
      );
    }
  );

  it("shows restored wave guidelines immediately without a collapse control", () => {
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Rank, "Restored rule")}
        setDisplay={jest.fn()}
        setDrops={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Wave guidelines and acceptance",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Wave guidelines and acceptance/ })
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Restored rule")).toBeVisible();
  });
});
