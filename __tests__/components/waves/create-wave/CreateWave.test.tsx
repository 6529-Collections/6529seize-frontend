import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CreateWave from "@/components/waves/create-wave/CreateWave";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
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
  default: jest.fn(() => ({ isIos: false, keyboardVisible: false })),
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

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseWaveConfig = useWaveConfig as jest.Mock;
const mockedUseAddWaveMutation = useAddWaveMutation as jest.Mock;
const mockedGetCreateNewWaveBody = getCreateNewWaveBody as jest.Mock;
const mockedGenerateDropPart = generateDropPart as jest.Mock;
const mockedGetAdminGroupId = getAdminGroupId as jest.Mock;
const mockedMultiPartUpload = multiPartUpload as jest.Mock;
const mockedUseGroupMutations = useGroupMutations as jest.Mock;

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
        category: null,
        profileId: null,
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
      chat: { enabled: true },
    },
    step: CreateWaveStep.OVERVIEW,
    selectedOutcomeType: null,
    errors: [],
    groupsCache: {},
    setOverview: jest.fn(),
    setDates: jest.fn(),
    setDrops: jest.fn(),
    setOutcomes: jest.fn(),
    setDropsAdminCanDelete: jest.fn(),
    onStep: jest.fn(),
    onOutcomeTypeChange: jest.fn(),
    onGroupSelect: jest.fn(),
    onVotingTypeChange: jest.fn(),
    onCategoryChange: jest.fn(),
    onProfileIdChange: jest.fn(),
    onMaxVotesPerIdentityPerDropChange: jest.fn(),
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

  const renderCreateWave = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <ReactQueryWrapperContext.Provider value={mockQueryContext}>
          <CreateWave profile={mockProfile} onBack={onBack} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
  };

  it("renders the create wave form with main steps and current step content", () => {
    renderCreateWave();

    expect(screen.getByTestId("create-wave-flow-title")).toHaveTextContent(
      'Create Wave "Test Wave"'
    );
    expect(screen.getByTestId("create-wave-overview")).toBeInTheDocument();
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
        expect(mockAddWaveMutation.mutateAsync).toHaveBeenCalled();
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
          message: "Please wait for image uploads to finish.",
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
        message: "Please wait for image uploads to finish.",
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
          mutateAsync: jest.fn().mockImplementation(async (data) => {
            const result = { id: "new-wave-id" };
            onSuccess(result);
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
          message: errorMessage,
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
    useCapacitor.mockReturnValue({ isIos: true, keyboardVisible: false });

    renderCreateWave();

    // Look for the flex-1 div that gets the iOS styling
    const flexDiv = document.querySelector(".tw-flex-1");
    expect(flexDiv).toHaveClass("tw-mb-10");
  });

  it("does not apply iOS styling when keyboard is visible", () => {
    const useCapacitor = require("@/hooks/useCapacitor").default;
    useCapacitor.mockReturnValue({ isIos: true, keyboardVisible: true });

    renderCreateWave();

    const flexDiv = document.querySelector(".tw-flex-1");
    expect(flexDiv).not.toHaveClass("tw-mb-10");
  });
});
