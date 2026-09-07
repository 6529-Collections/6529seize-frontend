import { render, screen } from "@testing-library/react";
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
  it.each([ApiWaveType.Chat, ApiWaveType.Rank, ApiWaveType.Approve])(
    "shows %s chat guidelines without submission rules or a configuration summary",
    (waveType) => {
      render(
        <CreateWaveRules config={getConfig(waveType)} setDisplay={jest.fn()} />
      );

      expect(
        screen.getByRole("heading", { level: 2, name: "Guidelines" })
      ).toBeVisible();
      expect(screen.queryByTestId("rules-panel")).not.toBeInTheDocument();
      expect(screen.queryByText("Automatic rules")).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          "Automatic rules are generated from the wave setup. Add creator rules only for wave-specific requirements that are not already covered."
        )
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 3, name: "Chat guidelines" })
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Chat guidelines" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: "Rules that require acceptance" })
      ).toBeNull();

      expect(
        screen.getByRole("textbox", { name: "Chat guidelines" })
      ).toBeVisible();
      expect(
        screen.getByText(
          "These guidelines will be shown to user when they send their first chat message"
        )
      ).toBeVisible();
      expect(
        screen.getByPlaceholderText("Add chat guidelines...")
      ).toBeVisible();
      expect(
        screen.queryByText("Display-only creator rules")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          "Leave blank when automatic rules already cover the wave."
        )
      ).not.toBeInTheDocument();
    }
  );

  it("shows restored chat guidelines immediately without a collapse control", () => {
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Rank, "Restored rule")}
        setDisplay={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Chat guidelines",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Chat guidelines" })
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Restored rule")).toBeVisible();
  });
});
