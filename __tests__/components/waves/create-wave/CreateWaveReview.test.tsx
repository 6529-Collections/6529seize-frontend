import { render, screen } from "@testing-library/react";
import CreateWaveReview from "@/components/waves/create-wave/review/CreateWaveReview";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveConfig } from "@/types/waves.types";
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { primary_wallet: "0xcreator" } }),
}));
jest.mock(
  "@/components/waves/create-wave/rules/CreateWaveRulesGroupMembers",
  () => ({
    __esModule: true,
    default: ({
      roleLabel,
      target,
    }: {
      roleLabel: string;
      target?: { kind: string };
    }) => (
      <button>
        {roleLabel}: {target?.kind ?? "saved"}
      </button>
    ),
  })
);
jest.mock(
  "@/components/waves/create-wave/review/CreateWaveReviewDescription",
  () => ({
    __esModule: true,
    default: () => <section>Description preview</section>,
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

describe("CreateWaveReview", () => {
  it("shows the final configuration and guidelines without editable fields", () => {
    render(
      <CreateWaveReview
        config={getConfig(ApiWaveType.Chat, "Be kind.")}
        groupsCache={{}}
        description={null}
        parentWaveName="Parent Wave"
      />
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Overview" })
    ).toBeVisible();
    expect(screen.getByText("Rules test wave")).toBeVisible();
    expect(screen.getByText("Parent Wave")).toBeVisible();
    expect(screen.getByText("Be kind.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Admins: draft" })).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
