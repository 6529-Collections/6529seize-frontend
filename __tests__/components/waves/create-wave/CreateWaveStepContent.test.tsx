import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import CreateWaveStepContent from "@/components/waves/create-wave/CreateWaveStepContent";
import type { CreateWaveDescriptionHandles } from "@/components/waves/create-wave/description/CreateWaveDescription";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CreateWaveConfig } from "@/types/waves.types";
import { CreateWaveStep } from "@/types/waves.types";

/**
 * Every step body is a component with its own spec, so this suite only pins the
 * dispatcher: which child a step renders, and which slice of the config and which
 * controller callbacks it receives.
 */
jest.mock("@/components/waves/create-wave/overview/CreateWaveOverview", () => {
  return {
    __esModule: true,
    default: function MockOverview(props: {
      readonly overview: { name: string };
      readonly ongoingRanking: boolean;
      readonly onOngoingRankingChange: (ongoingRanking: boolean) => void;
    }) {
      return (
        <div
          data-testid="overview"
          data-name={props.overview.name}
          data-ongoing-ranking={String(props.ongoingRanking)}>
          <button
            type="button"
            onClick={() => props.onOngoingRankingChange(true)}>
            enable-ongoing
          </button>
        </div>
      );
    },
  };
});

jest.mock("@/components/waves/create-wave/groups/CreateWaveGroups", () => {
  return {
    __esModule: true,
    default: function MockGroups(props: {
      readonly waveName: string;
      readonly waveType: ApiWaveType;
      readonly chatEnabled: boolean;
      readonly adminCanDeleteDrops: boolean;
    }) {
      return (
        <div
          data-testid="groups"
          data-wave-name={props.waveName}
          data-wave-type={props.waveType}
          data-chat-enabled={String(props.chatEnabled)}
          data-admin-can-delete={String(props.adminCanDeleteDrops)}
        />
      );
    },
  };
});

jest.mock("@/components/waves/create-wave/dates/CreateWaveDates", () => {
  return {
    __esModule: true,
    default: function MockDates(props: { readonly waveType: ApiWaveType }) {
      return <div data-testid="dates" data-wave-type={props.waveType} />;
    },
  };
});

jest.mock("@/components/waves/create-wave/drops/CreateWaveDrops", () => {
  return {
    __esModule: true,
    default: function MockDrops(props: {
      readonly waveType: ApiWaveType;
      readonly ongoingRanking: boolean;
    }) {
      return (
        <div
          data-testid="drops"
          data-wave-type={props.waveType}
          data-ongoing-ranking={String(props.ongoingRanking)}
        />
      );
    },
  };
});

jest.mock("@/components/waves/create-wave/CreateWaveRules", () => {
  return {
    __esModule: true,
    default: function MockRules() {
      return <div data-testid="rules" />;
    },
  };
});

jest.mock("@/components/waves/create-wave/voting/CreateWaveVoting", () => {
  return {
    __esModule: true,
    default: function MockVoting(props: {
      readonly selectedType: ApiWaveCreditType;
      readonly isMemeCountLoading: boolean;
      readonly isMemeCountError: boolean;
    }) {
      return (
        <div
          data-testid="voting"
          data-selected-type={props.selectedType}
          data-meme-loading={String(props.isMemeCountLoading)}
          data-meme-error={String(props.isMemeCountError)}
        />
      );
    },
  };
});

jest.mock("@/components/waves/create-wave/outcomes/CreateWaveOutcomes", () => {
  return {
    __esModule: true,
    default: function MockOutcomes(props: {
      readonly outcomeType: string | null;
      readonly maxWinners: number | null;
    }) {
      return (
        <div
          data-testid="outcomes"
          data-outcome-type={props.outcomeType ?? ""}
          data-max-winners={props.maxWinners ?? ""}
        />
      );
    },
  };
});

jest.mock(
  "@/components/waves/create-wave/description/CreateWaveDescription",
  () => {
    return {
      __esModule: true,
      default: function MockDescription(props: {
        readonly submitting: boolean;
        readonly showDropError: boolean;
        readonly visibilityGroupId: string | null;
        readonly wave: { name: string; image: string | null; id: string | null };
      }) {
        return (
          <div
            data-testid="description"
            data-submitting={String(props.submitting)}
            data-show-drop-error={String(props.showDropError)}
            data-visibility-group-id={props.visibilityGroupId ?? ""}
            data-wave-name={props.wave.name}
            data-wave-image={props.wave.image ?? ""}
          />
        );
      },
    };
  }
);

const buildConfig = (overrides: Partial<CreateWaveConfig> = {}) =>
  ({
    overview: {
      type: ApiWaveType.Rank,
      typeSelected: true,
      name: "My wave",
      image: null,
    },
    groups: {
      canView: "group-view",
      canDrop: null,
      canVote: null,
      canChat: null,
      admin: null,
    },
    chat: { enabled: true },
    dates: {
      submissionStartDate: 1,
      votingStartDate: 2,
      endDate: 3,
      firstDecisionTime: 4,
      subsequentDecisions: [],
      isRolling: false,
      ongoingRanking: false,
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
    voting: {
      type: ApiWaveCreditType.TdhPlusXtdh,
      creditScope: ApiWaveCreditScope.Wave,
      category: null,
      profileId: null,
      creditNfts: [],
      creditNftMemeCount: null,
      allowNegativeVotes: true,
      maxVotesPerIdentityPerDrop: null,
      winningThreshold: null,
      timeWeighted: {
        enabled: false,
        averagingInterval: 24,
        averagingIntervalUnit: "hours",
      },
    },
    outcomes: [],
    approval: { threshold: null, thresholdTimeMs: null, maxWinners: 5 },
    display: {
      customRules: null,
      outcomesVisible: true,
      submissionButtonLabel: null,
      approve: { approvalsTabLabel: "", approvedTabLabel: "" },
    },
    ...overrides,
  }) as CreateWaveConfig;

type StepContentProps = React.ComponentProps<typeof CreateWaveStepContent>;
type Controller = StepContentProps["controller"];

const buildController = (overrides: Partial<Controller> = {}): Controller =>
  ({
    config: buildConfig(),
    setConfig: jest.fn(),
    endDateConfig: { time: null, period: null },
    setEndDateConfig: jest.fn(),
    step: CreateWaveStep.OVERVIEW,
    selectedOutcomeType: null,
    errors: [],
    errorFocusRequest: 0,
    groupsCache: {},
    isMemeCountLoading: false,
    isMemeCountError: false,
    setOverview: jest.fn(),
    setDates: jest.fn(),
    setDrops: jest.fn(),
    setDropsAdminCanDelete: jest.fn(),
    setOutcomes: jest.fn(),
    setDisplay: jest.fn(),
    onStep: jest.fn(),
    onOutcomeTypeChange: jest.fn(),
    onGroupSelect: jest.fn(),
    onVotingTypeChange: jest.fn(),
    onCategoryChange: jest.fn(),
    onProfileIdChange: jest.fn(),
    onCreditNftsChange: jest.fn(),
    onCreditScopeChange: jest.fn(),
    onMaxVotesPerIdentityPerDropChange: jest.fn(),
    onAllowNegativeVotesChange: jest.fn(),
    onTimeWeightedVotingChange: jest.fn(),
    onWinningThresholdChange: jest.fn(),
    onThresholdChange: jest.fn(),
    onThresholdTimeChange: jest.fn(),
    onApprovalMaxWinnersChange: jest.fn(),
    onChatEnabledChange: jest.fn(),
    ...overrides,
  }) as Controller;

const profile = { handle: "alice" } as ApiIdentity;

const renderStep = (overrides: Partial<StepContentProps> = {}) => {
  const controller = (overrides.controller ??
    buildController()) as Controller;
  const view = render(
    <CreateWaveStepContent
      controller={controller}
      profile={profile}
      descriptionRef={createRef<CreateWaveDescriptionHandles | null>()}
      submitting={false}
      showDropError={false}
      onHaveDropToSubmitChange={jest.fn()}
      onInlineGroupCreate={jest.fn()}
      {...overrides}
    />
  );
  return { controller, ...view };
};

describe("CreateWaveStepContent", () => {
  it("renders the overview step with its heading and no other step body", () => {
    renderStep();

    expect(screen.getByTestId("overview")).toHaveAttribute(
      "data-name",
      "My wave"
    );
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect(screen.queryByTestId("groups")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dates")).not.toBeInTheDocument();
  });

  it("renders overview leading content above the overview card", () => {
    renderStep({
      overviewLeading: <div data-testid="drafts">saved drafts</div>,
    });

    expect(screen.getByTestId("drafts")).toBeInTheDocument();
  });

  it("folds an ongoing-ranking toggle into the dates slice", async () => {
    const controller = buildController();
    renderStep({ controller });

    await userEvent.click(
      screen.getByRole("button", { name: "enable-ongoing" })
    );

    expect(controller.setDates).toHaveBeenCalledWith(
      expect.objectContaining({ ongoingRanking: true, votingStartDate: 2 })
    );
  });

  it("treats a missing ongoingRanking flag as false", () => {
    const config = buildConfig();
    // Omit the optional flag entirely rather than setting it to undefined, which
    // `exactOptionalPropertyTypes` rejects — and which would not match a real
    // config loaded from an older draft anyway.
    const { ongoingRanking: _omitted, ...datesWithoutFlag } = config.dates;
    const controller = buildController({
      config: { ...config, dates: datesWithoutFlag },
    });

    renderStep({ controller });

    expect(screen.getByTestId("overview")).toHaveAttribute(
      "data-ongoing-ranking",
      "false"
    );
  });

  it("renders the groups step with the wave identity and chat settings", () => {
    renderStep({ controller: buildController({ step: CreateWaveStep.GROUPS }) });

    const groups = screen.getByTestId("groups");
    expect(groups).toHaveAttribute("data-wave-name", "My wave");
    expect(groups).toHaveAttribute("data-wave-type", ApiWaveType.Rank);
    expect(groups).toHaveAttribute("data-chat-enabled", "true");
    expect(groups).toHaveAttribute("data-admin-can-delete", "true");
  });

  it("renders the dates step", () => {
    renderStep({ controller: buildController({ step: CreateWaveStep.DATES }) });

    expect(screen.getByTestId("dates")).toHaveAttribute(
      "data-wave-type",
      ApiWaveType.Rank
    );
  });

  it("renders the drops step with the ongoing-ranking flag", () => {
    const config = buildConfig();
    renderStep({
      controller: buildController({
        step: CreateWaveStep.DROPS,
        config: {
          ...config,
          dates: { ...config.dates, ongoingRanking: true },
        } as CreateWaveConfig,
      }),
    });

    expect(screen.getByTestId("drops")).toHaveAttribute(
      "data-ongoing-ranking",
      "true"
    );
  });

  it("renders the rules step", () => {
    renderStep({ controller: buildController({ step: CreateWaveStep.RULES }) });

    expect(screen.getByTestId("rules")).toBeInTheDocument();
  });

  it("renders the voting step with meme-count query state", () => {
    renderStep({
      controller: buildController({
        step: CreateWaveStep.VOTING,
        isMemeCountLoading: true,
        isMemeCountError: false,
      }),
    });

    const voting = screen.getByTestId("voting");
    expect(voting).toHaveAttribute(
      "data-selected-type",
      ApiWaveCreditType.TdhPlusXtdh
    );
    expect(voting).toHaveAttribute("data-meme-loading", "true");
    expect(voting).toHaveAttribute("data-meme-error", "false");
  });

  it("renders nothing for the approval step", () => {
    const { container } = renderStep({
      controller: buildController({ step: CreateWaveStep.APPROVAL }),
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the outcomes step with the selected outcome type and max winners", () => {
    renderStep({
      controller: buildController({
        step: CreateWaveStep.OUTCOMES,
        selectedOutcomeType: null,
      }),
    });

    const outcomes = screen.getByTestId("outcomes");
    expect(outcomes).toHaveAttribute("data-outcome-type", "");
    expect(outcomes).toHaveAttribute("data-max-winners", "5");
  });

  it("renders the description step with the wave identity and no image", () => {
    renderStep({
      controller: buildController({ step: CreateWaveStep.DESCRIPTION }),
      submitting: true,
      showDropError: true,
    });

    const description = screen.getByTestId("description");
    expect(description).toHaveAttribute("data-submitting", "true");
    expect(description).toHaveAttribute("data-show-drop-error", "true");
    expect(description).toHaveAttribute(
      "data-visibility-group-id",
      "group-view"
    );
    expect(description).toHaveAttribute("data-wave-name", "My wave");
    expect(description).toHaveAttribute("data-wave-image", "");
  });

  it("previews a picked overview image as an object URL on the description step", () => {
    const createObjectURL = jest
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:https://6529.io/preview");

    try {
      const config = buildConfig();
      renderStep({
        controller: buildController({
          step: CreateWaveStep.DESCRIPTION,
          config: {
            ...config,
            overview: {
              ...config.overview,
              image: new File(["img"], "wave.png", { type: "image/png" }),
            },
          } as CreateWaveConfig,
        }),
      });

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("description")).toHaveAttribute(
        "data-wave-image",
        "blob:https://6529.io/preview"
      );
    } finally {
      createObjectURL.mockRestore();
    }
  });
});
