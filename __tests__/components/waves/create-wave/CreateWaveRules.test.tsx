import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import CreateWaveRules from "@/components/waves/create-wave/CreateWaveRules";
import type CreateWaveRulesGroupMembers from "@/components/waves/create-wave/rules/CreateWaveRulesGroupMembers";
import type WaveRulesPanel from "@/components/waves/specs/WaveRulesPanel";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveConfig } from "@/types/waves.types";

jest.mock("@/helpers/waves/wave-rules.helpers", () => ({
  buildWaveRules: jest.fn(() => []),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { primary_wallet: "0xcreator" },
  }),
}));

jest.mock(
  "@/components/waves/create-wave/rules/CreateWaveRulesGroupMembers",
  () => ({
    __esModule: true,
    default: (props: ComponentProps<typeof CreateWaveRulesGroupMembers>) => {
      const target = "target" in props ? props.target : null;
      const includedWallet =
        target?.kind === "draft"
          ? target.group.identity_addresses?.[0]
          : undefined;
      return (
        <div data-testid="rules-group-members">
          {props.roleLabel}:{target?.kind}:{includedWallet}
        </div>
      );
    },
  })
);

jest.mock("@/components/waves/specs/WaveRulesPanel", () => ({
  __esModule: true,
  default: ({
    title,
    showTitle,
    renderRowValue,
  }: ComponentProps<typeof WaveRulesPanel>) => (
    <>
      {showTitle !== false && <h3>{title}</h3>}
      <div data-testid="rules-panel" data-show-title={String(showTitle)} />
      {renderRowValue?.({
        id: "admin",
        label: "Admins",
        value: "Only me",
      })}
    </>
  ),
}));

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
  it("shows the creator-only admin audience as an explorable member value", () => {
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Chat)}
        groupsCache={{}}
        setDisplay={jest.fn()}
        setDrops={jest.fn()}
      />
    );

    expect(screen.getByTestId("rules-group-members")).toHaveTextContent(
      "Admins:draft:0xcreator"
    );
  });

  it("shows generated rules and Chat wave guidelines without redundant copy", () => {
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Chat)}
        groupsCache={{}}
        setDisplay={jest.fn()}
        setDrops={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Rules" })
    ).toBeVisible();
    expect(screen.getByTestId("rules-panel")).toHaveAttribute(
      "data-show-title",
      "false"
    );
    expect(screen.queryByText("Automatic rules")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Automatic rules are generated from the wave setup. Add creator rules only for wave-specific requirements that are not already covered."
      )
    ).not.toBeInTheDocument();
    const advancedButton = screen.getByRole("button", {
      name: "Wave guidelines",
    });
    expect(advancedButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("Wave guidelines")).not.toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Rules that require acceptance" })
    ).toBeNull();

    fireEvent.click(advancedButton);

    expect(screen.getByLabelText("Wave guidelines")).toBeVisible();
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
        groupsCache={{}}
        setDisplay={jest.fn()}
        setDrops={setDrops}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Wave guidelines and acceptance",
      })
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

  it("marks restored wave guidelines as Customized while collapsed", () => {
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Rank, "Restored rule")}
        groupsCache={{}}
        setDisplay={jest.fn()}
        setDrops={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", {
        name: /Wave guidelines and acceptance Customized/,
      })
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByDisplayValue("Restored rule")).not.toBeVisible();
  });
});
