import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import React from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CreateWave from "@/components/waves/create-wave/CreateWave";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CreateWaveStep } from "@/types/waves.types";

jest.mock("@/components/waves/create-wave/CreateWaveFlow", () => {
  return {
    __esModule: true,
    default: ({ title, onBack, children }: any) => (
      <div data-testid="create-wave-flow">
        <div data-testid="create-wave-flow-title">{title}</div>
        <button type="button" onClick={onBack}>
          All Waves
        </button>
        {children}
      </div>
    ),
  };
});

// Mock all dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isIos: false })),
}));

jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: jest.fn(() => ({ isVisible: false })),
}));

jest.mock("@/components/waves/create-wave/hooks/useWaveConfig", () => ({
  useWaveConfig: jest.fn(),
}));

jest.mock("@/components/waves/create-wave/services/waveApiService", () => ({
  useAddWaveMutation: jest.fn(),
}));

jest.mock("@/helpers/waves/create-wave.helpers", () => ({
  getCreateNewWaveBody: jest.fn(),
}));

jest.mock("@/components/waves/create-wave/services/waveMediaService", () => ({
  generateDropPart: jest.fn(),
}));

jest.mock("@/components/waves/create-wave/services/waveGroupService", () => ({
  getAdminGroupId: jest.fn(),
}));

jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest.fn(),
}));

jest.mock("@/hooks/groups/useGroupMutations", () => ({
  useGroupMutations: jest.fn(),
}));

jest.mock("@/services/api/waves-v2-api", () => ({
  createWaveMetadata: jest.fn(),
}));

// Mock step components
jest.mock("@/components/waves/create-wave/overview/CreateWaveOverview", () => {
  return function MockCreateWaveOverview() {
    return <div data-testid="create-wave-overview">Overview Step</div>;
  };
});

jest.mock("@/components/waves/create-wave/groups/CreateWaveGroups", () => {
  return function MockCreateWaveGroups() {
    return <div data-testid="create-wave-groups">Groups Step</div>;
  };
});

jest.mock("@/components/waves/create-wave/utils/CreateWaveActions", () => {
  return function MockCreateWaveActions({
    onComplete,
  }: {
    onComplete: () => void;
  }) {
    return (
      <div data-testid="create-wave-actions">
        <button onClick={onComplete}>Complete</button>
      </div>
    );
  };
});

const mockGetDropSnapshot = jest.fn();
const mockRequestDrop = jest.fn();

jest.mock(
  "@/components/waves/create-wave/description/CreateWaveDescription",
  () => {
    return React.forwardRef(function MockCreateWaveDescription(
      { submitting, showDropError, onHaveDropToSubmitChange }: any,
      ref: any
    ) {
      React.useImperativeHandle(ref, () => ({
        getDropSnapshot: mockGetDropSnapshot,
        requestDrop: mockRequestDrop,
      }));

      return (
        <div
          data-testid="create-wave-description"
          data-submitting={submitting}
          data-show-drop-error={showDropError}
        >
          Description Step
          <input onChange={() => onHaveDropToSubmitChange(true)} />
        </div>
      );
    });
  }
);

import { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import { useAddWaveMutation } from "@/components/waves/create-wave/services/waveApiService";
import { getAdminGroupId } from "@/components/waves/create-wave/services/waveGroupService";
import { generateDropPart } from "@/components/waves/create-wave/services/waveMediaService";
import { getCreateNewWaveBody } from "@/helpers/waves/create-wave.helpers";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import { createWaveMetadata } from "@/services/api/waves-v2-api";

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseWaveConfig = useWaveConfig as jest.Mock;
const mockedUseAddWaveMutation = useAddWaveMutation as jest.Mock;
const mockedGetCreateNewWaveBody = getCreateNewWaveBody as jest.Mock;
const mockedGenerateDropPart = generateDropPart as jest.Mock;
const mockedGetAdminGroupId = getAdminGroupId as jest.Mock;
const mockedMultiPartUpload = multiPartUpload as jest.Mock;
const mockedUseGroupMutations = useGroupMutations as jest.Mock;
const mockedCreateWaveMetadata = createWaveMetadata as jest.Mock;

describe("CreateWave", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockProfile: ApiIdentity = {
    id: "test-profile-id",
    handle: "testuser",
    normalised_handle: "testuser",
    primary_wallet: "0x123",
    pfp: null,
    cic: { rating: 100, contributor_count: 5 },
    rep: { rating: 200, contributor_count: 10 },
    tdh: 1000,
    level: 5,
    classification: "HUMAN",
    sub_classification: null,
    created_at: Date.now(),
  };

  const mockAuthContext = {
    requestAuth: jest.fn(),
    setToast: jest.fn(),
    connectedProfile: mockProfile,
  };

  const mockQueryContext = {
    waitAndInvalidateDrops: jest.fn(),
    onWaveCreated: jest.fn(),
    onGroupCreate: jest.fn(),
  };

  const mockWaveConfig = {
    config: {
      overview: {
        type: "CHAT",
        name: "Test Wave",
        image: null,
      },
      groups: {
        admin: "admin-group-id",
        canView: null,
        canDrop: null,
        canVote: null,
        canChat: null,
      },
      dates: {
        submissionStartDate: Date.now(),
        votingStartDate: Date.now(),
        endDate: null,
        firstDecisionTime: Date.now(),
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
        adminCanDeleteDrops: false,
      },
      voting: {
        type: "TDH",
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
      approval: {
        threshold: null,
        thresholdTimeMs: null,
        maxWinners: null,
      },
      display: {
        customRules: null,
        outcomesVisible: true,
        approve: {
          approvalsTabLabel: "",
          approvedTabLabel: "",
        },
      },
      chat: { enabled: true },
    },
    step: CreateWaveStep.OVERVIEW,
    selectedOutcomeType: null,
    errors: [],
    groupsCache: {},
    isMemeCountLoading: false,
    isMemeCountError: false,
    setOverview: jest.fn(),
    setDates: jest.fn(),
    setDrops: jest.fn(),
    setOutcomes: jest.fn(),
    setDisplay: jest.fn(),
    setDropsAdminCanDelete: jest.fn(),
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
  };

  const mockAddWaveMutation = {
    mutateAsync: jest.fn(),
  };

  const onBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDropSnapshot.mockReturnValue({
      parts: [{ content: "Test content" }],
      title: "Test Drop",
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
    });
    mockRequestDrop.mockReturnValue({
      parts: [{ content: "Saved content" }],
      title: "Saved Drop",
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
    });
    mockedUseRouter.mockReturnValue(mockRouter);
    mockedUseWaveConfig.mockReturnValue(mockWaveConfig);
    mockedUseAddWaveMutation.mockReturnValue(mockAddWaveMutation);
    mockedGetAdminGroupId.mockResolvedValue("admin-group-id");
    mockedCreateWaveMetadata.mockResolvedValue({
      id: 1,
      data_key: "key",
      data_value: "value",
    });
    mockedMultiPartUpload.mockResolvedValue({
      url: "https://example.com/image.jpg",
    });
    mockedUseGroupMutations.mockReturnValue({
      submit: jest.fn(),
    });
    mockAuthContext.requestAuth.mockResolvedValue({ success: true });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => "mocked-object-url");
  });

  type RenderCreateWaveOptions = {
    readonly parentWaveId?: string | null | undefined;
  };

  const createWaveElement = ({
    parentWaveId,
  }: RenderCreateWaveOptions = {}) => (
    <AuthContext.Provider value={mockAuthContext}>
      <ReactQueryWrapperContext.Provider value={mockQueryContext}>
        <CreateWave
          profile={mockProfile}
          onBack={onBack}
          parentWaveId={parentWaveId}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );

  const renderCreateWave = (options: RenderCreateWaveOptions = {}) =>
    render(createWaveElement(options));

  it("renders the create wave form with main steps and current step content", () => {
    renderCreateWave();

    expect(screen.getByTestId("create-wave-flow-title")).toHaveTextContent(
      'Create Wave "Test Wave"'
    );
    expect(screen.getByTestId("create-wave-overview")).toBeInTheDocument();
  });

  it("uses subwave title when creating under a parent wave", () => {
    renderCreateWave({ parentWaveId: "parent-wave" });

    expect(screen.getByTestId("create-wave-flow-title")).toHaveTextContent(
      'Create subwave "Test Wave"'
    );
  });

  it("calls onBack when back button is clicked", () => {
    renderCreateWave();

    const backButton = screen.getByRole("button", { name: /all waves/i });
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });

  it("renders different steps based on config step", () => {
    const configWithGroupsStep = {
      ...mockWaveConfig,
      step: CreateWaveStep.GROUPS,
    };
    mockedUseWaveConfig.mockReturnValue(configWithGroupsStep);

    renderCreateWave();

    expect(screen.getByTestId("create-wave-groups")).toBeInTheDocument();
  });

  it("hides acceptance rules on the chat rules step", () => {
    mockedUseWaveConfig.mockReturnValue({
      ...mockWaveConfig,
      step: CreateWaveStep.RULES,
      config: {
        ...mockWaveConfig.config,
        overview: {
          ...mockWaveConfig.config.overview,
          type: ApiWaveType.Chat,
        },
      },
    });

    renderCreateWave();

    expect(
      screen.getByLabelText("Display-only creator rules")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Rules that require acceptance")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Require acceptance")).not.toBeInTheDocument();
  });

  it("shows acceptance rules on the rank rules step", () => {
    mockedUseWaveConfig.mockReturnValue({
      ...mockWaveConfig,
      step: CreateWaveStep.RULES,
      config: {
        ...mockWaveConfig.config,
        overview: {
          ...mockWaveConfig.config.overview,
          type: ApiWaveType.Rank,
        },
      },
    });

    renderCreateWave();

    expect(
      screen.getByText("Rules that require acceptance")
    ).toBeInTheDocument();
    expect(screen.getByText("Require acceptance")).toBeInTheDocument();
  });

  it("shows actions component when no outcome type is selected", () => {
    renderCreateWave();

    expect(screen.getByTestId("create-wave-actions")).toBeInTheDocument();
  });

  it("hides actions component when outcome type is selected", () => {
    const configWithOutcomeType = {
      ...mockWaveConfig,
      selectedOutcomeType: "REP",
    };
    mockedUseWaveConfig.mockReturnValue(configWithOutcomeType);

    renderCreateWave();

    expect(screen.queryByTestId("create-wave-actions")).not.toBeInTheDocument();
  });

  describe("Wave Submission", () => {
    beforeEach(() => {
      mockedGenerateDropPart.mockResolvedValue({
        content: "Test content",
        quoted_drop: null,
        media: [],
      });

      mockedGetCreateNewWaveBody.mockReturnValue({
        name: "Test Wave",
        description: "Test description",
      });
    });

    it("successfully submits wave when all conditions are met", async () => {
      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockAuthContext.requestAuth).toHaveBeenCalled();
        expect(mockGetDropSnapshot).toHaveBeenCalled();
        expect(mockRequestDrop).not.toHaveBeenCalled();
        expect(mockedGetAdminGroupId).toHaveBeenCalled();
        expect(mockAddWaveMutation.mutateAsync).toHaveBeenCalledWith({
          body: {
            name: "Test Wave",
            description: "Test description",
          },
          displayMetadataRequests: [],
        });
      });
    });

    it("passes parent wave id into submitted subwave body", async () => {
      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave({ parentWaveId: "parent-wave" });

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(mockedGetCreateNewWaveBody).toHaveBeenCalledWith(
          expect.objectContaining({
            parentWaveId: "parent-wave",
          })
        );
      });
    });

    it("locks the description while submit work is pending", async () => {
      let resolveAuth: ((value: { success: boolean }) => void) | undefined;
      mockAuthContext.requestAuth.mockReturnValue(
        new Promise((resolve) => {
          resolveAuth = resolve;
        })
      );

      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave();

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(screen.getByTestId("create-wave-description")).toHaveAttribute(
          "data-submitting",
          "true"
        );
      });

      await act(async () => {
        resolveAuth?.({ success: false });
      });

      await waitFor(() => {
        expect(screen.getByTestId("create-wave-description")).toHaveAttribute(
          "data-submitting",
          "false"
        );
      });
    });

    it("shows error when authentication fails", async () => {
      mockAuthContext.requestAuth.mockResolvedValue({ success: false });

      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockAuthContext.requestAuth).toHaveBeenCalled();
        expect(mockAddWaveMutation.mutateAsync).not.toHaveBeenCalled();
      });
    });

    it("shows drop error when no drop content is provided", async () => {
      mockGetDropSnapshot.mockReturnValue({ parts: [] });

      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockAuthContext.requestAuth).toHaveBeenCalled();
        expect(mockGetDropSnapshot).toHaveBeenCalled();
        expect(mockRequestDrop).not.toHaveBeenCalled();
        expect(screen.getByTestId("create-wave-description")).toHaveAttribute(
          "data-show-drop-error",
          "true"
        );
        expect(mockAddWaveMutation.mutateAsync).not.toHaveBeenCalled();
      });
    });

    it("blocks submission while inline image uploads are still pending", async () => {
      mockGetDropSnapshot.mockReturnValue({
        parts: [{ content: "Draft with ![Seize](loading)" }],
        title: "Test Drop",
        referenced_nfts: [],
        mentioned_users: [],
        metadata: [],
      });

      const configOnDescriptionStep = {
        ...mockWaveConfig,
        config: {
          ...mockWaveConfig.config,
          overview: {
            ...mockWaveConfig.config.overview,
            image: new File([""], "test.jpg", { type: "image/jpeg" }),
          },
        },
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockAuthContext.setToast).toHaveBeenCalledWith({
          message: "Wait for image uploads to finish.",
          type: "error",
        });
        expect(screen.getByTestId("create-wave-description")).toHaveAttribute(
          "data-submitting",
          "false"
        );
      });

      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
      expect(mockGetDropSnapshot).toHaveBeenCalled();
      expect(mockedGetAdminGroupId).not.toHaveBeenCalled();
      expect(mockedGenerateDropPart).not.toHaveBeenCalled();
      expect(mockedMultiPartUpload).not.toHaveBeenCalled();
      expect(mockAddWaveMutation.mutateAsync).not.toHaveBeenCalled();
    });

    it("allows submission once inline image uploads have finished", async () => {
      mockGetDropSnapshot.mockReturnValue({
        parts: [
          { content: "Draft with ![Seize](https://cdn.example/image.png)" },
        ],
        title: "Test Drop",
        referenced_nfts: [],
        mentioned_users: [],
        metadata: [],
      });

      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockedGetAdminGroupId).toHaveBeenCalled();
        expect(mockedGenerateDropPart).toHaveBeenCalled();
        expect(mockAddWaveMutation.mutateAsync).toHaveBeenCalled();
      });

      expect(mockAuthContext.setToast).not.toHaveBeenCalledWith({
        message: "Wait for image uploads to finish.",
        type: "error",
      });
    });

    it("shows error when admin group retrieval fails", async () => {
      mockedGetAdminGroupId.mockResolvedValue(null);

      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockedGetAdminGroupId).toHaveBeenCalled();
        expect(mockAddWaveMutation.mutateAsync).not.toHaveBeenCalled();
      });
    });

    it("uploads image when provided in config", async () => {
      const configWithImage = {
        ...mockWaveConfig,
        config: {
          ...mockWaveConfig.config,
          overview: {
            ...mockWaveConfig.config.overview,
            image: new File([""], "test.jpg", { type: "image/jpeg" }),
          },
        },
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configWithImage);

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockedMultiPartUpload).toHaveBeenCalledWith({
          file: expect.any(File),
          path: "wave",
        });
      });
    });

    it("redirects to wave page on successful submission", async () => {
      mockAddWaveMutation.mutateAsync.mockResolvedValue({ id: "new-wave-id" });

      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      // Mock the mutation to call onSuccess
      mockedUseAddWaveMutation.mockImplementation(({ onSuccess }) => {
        const mutation = {
          mutateAsync: jest.fn().mockImplementation(async (variables) => {
            const result = { id: "new-wave-id" };
            await onSuccess(result, variables);
            return result;
          }),
        };
        return mutation;
      });

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/waves/new-wave-id");
        expect(mockQueryContext.waitAndInvalidateDrops).toHaveBeenCalled();
        expect(mockQueryContext.onWaveCreated).toHaveBeenCalled();
      });
      expect(mockedCreateWaveMetadata).not.toHaveBeenCalled();
    });

    it("saves changed display metadata before redirecting", async () => {
      const configOnDescriptionStep = {
        ...mockWaveConfig,
        config: {
          ...mockWaveConfig.config,
          overview: {
            ...mockWaveConfig.config.overview,
            type: "APPROVE",
          },
          display: {
            ...mockWaveConfig.config.display,
            approve: {
              approvalsTabLabel: " Candidates ",
              approvedTabLabel: "Selected",
            },
          },
        },
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);
      mockedUseAddWaveMutation.mockImplementation(({ onSuccess }) => ({
        mutateAsync: jest.fn().mockImplementation(async (variables) => {
          const result = { id: "new-wave-id" };
          await onSuccess(result, variables);
          return result;
        }),
      }));

      renderCreateWave();

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/waves/new-wave-id");
      });

      expect(mockedCreateWaveMetadata).toHaveBeenNthCalledWith(1, {
        waveId: "new-wave-id",
        body: {
          data_key: "wave_display.approve.tabs.approvals_label",
          data_value: "Candidates",
        },
      });
      expect(mockedCreateWaveMetadata).toHaveBeenNthCalledWith(2, {
        waveId: "new-wave-id",
        body: {
          data_key: "wave_display.approve.tabs.approved_label",
          data_value: "Selected",
        },
      });
      expect(mockedCreateWaveMetadata.mock.invocationCallOrder[0]).toBeLessThan(
        mockRouter.push.mock.invocationCallOrder[0]
      );
    });

    it("saves hidden outcome display metadata for rank waves", async () => {
      const configOnDescriptionStep = {
        ...mockWaveConfig,
        config: {
          ...mockWaveConfig.config,
          overview: {
            ...mockWaveConfig.config.overview,
            type: "RANK",
          },
          display: {
            outcomesVisible: false,
            approve: {
              approvalsTabLabel: "",
              approvedTabLabel: "",
            },
          },
        },
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);
      mockedUseAddWaveMutation.mockImplementation(({ onSuccess }) => ({
        mutateAsync: jest.fn().mockImplementation(async (variables) => {
          const result = { id: "new-wave-id" };
          await onSuccess(result, variables);
          return result;
        }),
      }));

      renderCreateWave();

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(mockedCreateWaveMetadata).toHaveBeenCalledWith({
          waveId: "new-wave-id",
          body: {
            data_key: "wave_display.outcomes.visible",
            data_value: "false",
          },
        });
      });
    });

    it("saves hidden outcome display metadata for approve waves", async () => {
      const configOnDescriptionStep = {
        ...mockWaveConfig,
        config: {
          ...mockWaveConfig.config,
          overview: {
            ...mockWaveConfig.config.overview,
            type: "APPROVE",
          },
          display: {
            ...mockWaveConfig.config.display,
            outcomesVisible: false,
          },
        },
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);
      mockedUseAddWaveMutation.mockImplementation(({ onSuccess }) => ({
        mutateAsync: jest.fn().mockImplementation(async (variables) => {
          const result = { id: "new-wave-id" };
          await onSuccess(result, variables);
          return result;
        }),
      }));

      renderCreateWave();

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(mockedCreateWaveMetadata).toHaveBeenCalledWith({
          waveId: "new-wave-id",
          body: {
            data_key: "wave_display.outcomes.visible",
            data_value: "false",
          },
        });
      });
    });

    it("saves display-only custom rules metadata for chat waves", async () => {
      const configOnDescriptionStep = {
        ...mockWaveConfig,
        config: {
          ...mockWaveConfig.config,
          overview: {
            ...mockWaveConfig.config.overview,
            type: "CHAT",
          },
          display: {
            ...mockWaveConfig.config.display,
            customRules: "  Keep submissions original.  ",
          },
        },
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);
      mockedUseAddWaveMutation.mockImplementation(({ onSuccess }) => ({
        mutateAsync: jest.fn().mockImplementation(async (variables) => {
          const result = { id: "new-wave-id" };
          await onSuccess(result, variables);
          return result;
        }),
      }));

      renderCreateWave();

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(mockedCreateWaveMetadata).toHaveBeenCalledWith({
          waveId: "new-wave-id",
          body: {
            data_key: "wave_display.rules.custom",
            data_value: "Keep submissions original.",
          },
        });
      });
    });

    it("uses the display metadata snapshot from submit time", async () => {
      const submittedConfig = {
        ...mockWaveConfig,
        config: {
          ...mockWaveConfig.config,
          overview: {
            ...mockWaveConfig.config.overview,
            type: "APPROVE",
          },
          display: {
            ...mockWaveConfig.config.display,
            approve: {
              approvalsTabLabel: "Candidates",
              approvedTabLabel: "Selected",
            },
          },
        },
        step: CreateWaveStep.DESCRIPTION,
      };
      const laterConfig = {
        ...submittedConfig,
        config: {
          ...submittedConfig.config,
          display: {
            ...submittedConfig.config.display,
            approve: {
              approvalsTabLabel: "Apps",
              approvedTabLabel: "Chosen",
            },
          },
        },
      };
      let latestOnSuccess:
        | ((
            result: { readonly id: string },
            variables: unknown
          ) => Promise<void>)
        | undefined;
      let resolveMutation: (() => void) | undefined;
      const mutateAsync = jest.fn().mockImplementation(async (variables) => {
        await new Promise<void>((resolve) => {
          resolveMutation = resolve;
        });
        const result = { id: "new-wave-id" };
        await latestOnSuccess?.(result, variables);
        return result;
      });

      mockedUseWaveConfig.mockReturnValue(submittedConfig);
      mockedUseAddWaveMutation.mockImplementation(({ onSuccess }) => {
        latestOnSuccess = onSuccess;
        return { mutateAsync };
      });

      const renderResult = renderCreateWave();

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          body: {
            name: "Test Wave",
            description: "Test description",
          },
          displayMetadataRequests: [
            {
              data_key: "wave_display.approve.tabs.approvals_label",
              data_value: "Candidates",
            },
            {
              data_key: "wave_display.approve.tabs.approved_label",
              data_value: "Selected",
            },
          ],
        });
      });

      mockedUseWaveConfig.mockReturnValue(laterConfig);
      renderResult.rerender(createWaveElement());

      await act(async () => {
        resolveMutation?.();
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/waves/new-wave-id");
      });

      expect(mockedCreateWaveMetadata).toHaveBeenNthCalledWith(1, {
        waveId: "new-wave-id",
        body: {
          data_key: "wave_display.approve.tabs.approvals_label",
          data_value: "Candidates",
        },
      });
      expect(mockedCreateWaveMetadata).toHaveBeenNthCalledWith(2, {
        waveId: "new-wave-id",
        body: {
          data_key: "wave_display.approve.tabs.approved_label",
          data_value: "Selected",
        },
      });
      expect(mockedCreateWaveMetadata).not.toHaveBeenCalledWith({
        waveId: "new-wave-id",
        body: {
          data_key: "wave_display.approve.tabs.approvals_label",
          data_value: "Apps",
        },
      });
    });

    it("warns and still redirects when display metadata save fails", async () => {
      mockedCreateWaveMetadata.mockRejectedValue(new Error("metadata failed"));
      const configOnDescriptionStep = {
        ...mockWaveConfig,
        config: {
          ...mockWaveConfig.config,
          overview: {
            ...mockWaveConfig.config.overview,
            type: "APPROVE",
          },
          display: {
            ...mockWaveConfig.config.display,
            approve: {
              approvalsTabLabel: "Candidates",
              approvedTabLabel: "",
            },
          },
        },
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);
      mockedUseAddWaveMutation.mockImplementation(({ onSuccess }) => ({
        mutateAsync: jest.fn().mockImplementation(async (variables) => {
          const result = { id: "new-wave-id" };
          await onSuccess(result, variables);
          return result;
        }),
      }));

      renderCreateWave();

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(mockAuthContext.setToast).toHaveBeenCalledWith({
          message: "Wave created, but custom display settings were not saved.",
          type: "warning",
        });
        expect(mockRouter.push).toHaveBeenCalledWith("/waves/new-wave-id");
      });
    });

    it("shows toast on submission error", async () => {
      const errorMessage = "Failed to create wave";

      // Mock the mutation to call onError without rejecting the promise twice
      mockedUseAddWaveMutation.mockImplementation(({ onError, onSettled }) => {
        const mutation = {
          mutateAsync: jest.fn().mockImplementation(async () => {
            try {
              onError(errorMessage);
              onSettled();
              throw new Error(errorMessage);
            } catch (error) {
              // Handle the error internally to prevent unhandled rejection
            }
          }),
        };
        return mutation;
      });

      const configOnDescriptionStep = {
        ...mockWaveConfig,
        step: CreateWaveStep.DESCRIPTION,
      };
      mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

      renderCreateWave();

      const completeButton = screen.getByRole("button", { name: /complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockAuthContext.setToast).toHaveBeenCalledWith({
          title: "Couldn't create this wave.",
          description: "Please try again.",
          details: `${errorMessage}.`,
          type: "error",
        });
        expect(mockGetDropSnapshot).toHaveBeenCalled();
        expect(mockRequestDrop).not.toHaveBeenCalled();
      });
    });
  });

  it("handles drop error state changes correctly", () => {
    const configOnDescriptionStep = {
      ...mockWaveConfig,
      step: CreateWaveStep.DESCRIPTION,
    };
    mockedUseWaveConfig.mockReturnValue(configOnDescriptionStep);

    renderCreateWave();

    // Simulate having a drop to submit
    const descriptionComponent = screen.getByTestId("create-wave-description");
    const inputElement = descriptionComponent.querySelector("input");

    expect(inputElement).not.toBeNull();

    // Simulate the onHaveDropToSubmitChange callback
    fireEvent.change(inputElement as HTMLInputElement, {
      target: { value: "some content" },
    });

    // This would normally clear the showDropError state
    expect(descriptionComponent).toBeInTheDocument();
  });

  it("applies iOS specific styling when on iOS with keyboard not visible", () => {
    const useCapacitor = require("@/hooks/useCapacitor").default;
    useCapacitor.mockReturnValue({ isIos: true });
    (useNativeKeyboard as jest.Mock).mockReturnValue({ isVisible: false });

    renderCreateWave();

    // Look for the flex-1 div that gets the iOS styling
    const flexDiv = document.querySelector(".tw-flex-1");
    expect(flexDiv).toHaveClass("tw-mb-10");
  });

  it("does not apply iOS styling when keyboard is visible", () => {
    const useCapacitor = require("@/hooks/useCapacitor").default;
    useCapacitor.mockReturnValue({ isIos: true });
    (useNativeKeyboard as jest.Mock).mockReturnValue({ isVisible: true });

    renderCreateWave();

    const flexDiv = document.querySelector(".tw-flex-1");
    expect(flexDiv).not.toHaveClass("tw-mb-10");
  });
});
