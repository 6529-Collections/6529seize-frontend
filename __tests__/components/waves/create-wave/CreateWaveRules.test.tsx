import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveRules from "@/components/waves/create-wave/CreateWaveRules";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveConfig } from "@/types/waves.types";

jest.mock(
  "@/components/waves/create-wave/drops/terms/CreateWaveTermsOfService",
  () => ({
    __esModule: true,
    default: ({ setTerms }: { setTerms: (terms: string) => void }) => (
      <button type="button" onClick={() => setTerms("Binding rule")}>
        Rules that require acceptance
      </button>
    ),
  })
);

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
      screen.queryByRole("button", { name: "Rules that require acceptance" })
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

  it("includes acceptance rules for Rank waves and preserves their handler", () => {
    const setDrops = jest.fn();
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Rank)}
        setDisplay={jest.fn()}
        setDrops={setDrops}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Rules that require acceptance" })
    );

    expect(setDrops).toHaveBeenCalledWith(
      expect.objectContaining({
        terms: "Binding rule",
        signatureRequired: true,
      })
    );
  });

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
