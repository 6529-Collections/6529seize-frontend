import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import WaveSpecs from "@/components/waves/specs/WaveSpecs";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WAVE_DISPLAY_METADATA_KEYS } from "@/helpers/waves/wave-metadata.helpers";
import { commonApiPost } from "@/services/api/common-api";
import {
  createWaveMetadata,
  deleteWaveMetadata,
  fetchWaveMetadata,
} from "@/services/api/waves-v2-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("@/components/waves/specs/WaveTypeIcon", () => () => (
  <div data-testid="wave-type-icon" />
));
jest.mock("@/components/waves/specs/WaveRating", () => () => (
  <div data-testid="wave-rating" />
));
jest.mock("@/components/waves/specs/WaveAuthor", () => () => (
  <div data-testid="wave-author" />
));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));
jest.mock("@/services/api/waves-v2-api", () => ({
  createWaveMetadata: jest.fn(),
  deleteWaveMetadata: jest.fn(),
  fetchWaveMetadata: jest.fn(),
}));

const commonApiPostMock = commonApiPost as jest.Mock;
const createWaveMetadataMock = createWaveMetadata as jest.Mock;
const deleteWaveMetadataMock = deleteWaveMetadata as jest.Mock;
const fetchWaveMetadataMock = fetchWaveMetadata as jest.Mock;
let waveMetadata: any[] = [];

const makeWave = (
  overrides: {
    readonly slowModeCooldownMs?: number | undefined;
    readonly canAdmin?: boolean | undefined;
    readonly chatEnabled?: boolean | undefined;
    readonly linksDisabled?: boolean | undefined;
    readonly waveType?: ApiWaveType | undefined;
    readonly creditScope?: ApiWaveCreditScope | undefined;
    readonly winningThreshold?: number | null | undefined;
    readonly winningThresholdMinDurationMs?: number | null | undefined;
    readonly submissionStrategy?: any;
  } = {}
): any => ({
  id: "wave-1",
  name: "Wave",
  picture: null,
  author: { handle: "creator" },
  voting: {
    scope: { group: null },
    credit_type: "REP",
    credit_category: null,
    creditor: null,
    credit_scope: overrides.creditScope ?? ApiWaveCreditScope.Wave,
    signature_required: false,
    period: null,
    forbid_negative_votes: false,
  },
  visibility: { scope: { group: null } },
  chat: {
    scope: { group: null },
    enabled: overrides.chatEnabled ?? true,
    authenticated_user_eligible: true,
    links_disabled: overrides.linksDisabled ?? false,
    slow_mode_cooldown_ms: overrides.slowModeCooldownMs,
  },
  participation: {
    scope: { group: null },
    authenticated_user_eligible: true,
    no_of_applications_allowed_per_participant: null,
    required_media: null,
    required_metadata: [],
    signature_required: false,
    period: null,
    terms: null,
    submission_strategy: overrides.submissionStrategy ?? null,
  },
  wave: {
    admin_drop_deletion_enabled: false,
    type: overrides.waveType ?? ApiWaveType.Chat,
    winning_threshold: overrides.winningThreshold ?? null,
    winning_threshold_min_duration_ms:
      overrides.winningThresholdMinDurationMs ?? null,
    max_winners: null,
    max_votes_per_identity_to_drop: null,
    time_lock_ms: null,
    admin_group: { group: null },
    decisions_strategy: null,
    authenticated_user_eligible_for_admin: overrides.canAdmin ?? false,
  },
  metrics: { your_participation_drops_count: 0 },
});

const renderWaveSpecs = ({
  wave = makeWave(),
  connectedHandle = "viewer",
}: {
  readonly wave?: any;
  readonly connectedHandle?: string | null;
} = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const requestAuth = jest.fn(async () => ({ success: true }));
  const setToast = jest.fn();
  const Providers = ({ children }: { readonly children: React.ReactNode }) => (
    <AuthContext.Provider
      value={
        {
          connectedProfile:
            connectedHandle === null ? null : { handle: connectedHandle },
          activeProfileProxy: null,
          requestAuth,
          setToast,
        } as any
      }
    >
      <QueryClientProvider client={queryClient}>
        <ReactQueryWrapperContext.Provider
          value={{ onWaveCreated: jest.fn() } as any}
        >
          {children}
        </ReactQueryWrapperContext.Provider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );

  return {
    ...render(<WaveSpecs wave={wave} />, { wrapper: Providers }),
    queryClient,
    requestAuth,
    setToast,
  };
};

const seedApprovalQueries = (queryClient: QueryClient) => {
  const waveKey = [QueryKey.WAVE, { wave_id: "wave-1" }] as const;
  const decisionsKey = [
    QueryKey.WAVE_DECISIONS,
    { waveId: "wave-1", pageSize: 2000 },
  ] as const;
  const dropsLeaderboardKey = [
    QueryKey.DROPS_LEADERBOARD,
    { waveId: "wave-1", page_size: 20 },
  ] as const;
  const dropsKey = [QueryKey.DROPS, { waveId: "wave-1", limit: 20 }] as const;
  queryClient.setQueryData(waveKey, { id: "wave-1" });
  queryClient.setQueryData(decisionsKey, { pages: [], pageParams: [] });
  queryClient.setQueryData(dropsLeaderboardKey, { pages: [] });
  queryClient.setQueryData(dropsKey, { pages: [] });

  return { waveKey, decisionsKey, dropsLeaderboardKey, dropsKey };
};

const expectApprovalQueriesInvalidated = (
  queryClient: QueryClient,
  keys: ReturnType<typeof seedApprovalQueries>,
  isInvalidated: boolean
) => {
  expect(queryClient.getQueryState(keys.waveKey)?.isInvalidated).toBe(
    isInvalidated
  );
  expect(queryClient.getQueryState(keys.decisionsKey)?.isInvalidated).toBe(
    isInvalidated
  );
  expect(
    queryClient.getQueryState(keys.dropsLeaderboardKey)?.isInvalidated
  ).toBe(isInvalidated);
  expect(queryClient.getQueryState(keys.dropsKey)?.isInvalidated).toBe(
    isInvalidated
  );
};

describe("WaveSpecs", () => {
  beforeEach(() => {
    commonApiPostMock.mockResolvedValue(makeWave());
    waveMetadata = [];
    fetchWaveMetadataMock.mockImplementation(async () => waveMetadata);
    createWaveMetadataMock.mockResolvedValue({
      id: 10,
      data_key: "key",
      data_value: "value",
    });
    deleteWaveMetadataMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the about heading", () => {
    renderWaveSpecs({ wave: makeWave() });

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.queryByText("General")).not.toBeInTheDocument();
  });

  it("hides voting for chat waves", () => {
    renderWaveSpecs({ wave: makeWave({ waveType: ApiWaveType.Chat }) });

    expect(screen.queryByText("Voting")).not.toBeInTheDocument();
    expect(screen.queryByText("Voting power")).not.toBeInTheDocument();
    expect(screen.queryByTestId("wave-rating")).not.toBeInTheDocument();
  });

  it("shows voting for non-chat waves", () => {
    renderWaveSpecs({ wave: makeWave({ waveType: ApiWaveType.Rank }) });

    expect(screen.getByText("Voting")).toBeInTheDocument();
    expect(screen.getByTestId("wave-rating")).toBeInTheDocument();
    expect(screen.getByText("Voting power")).toBeInTheDocument();
    expect(screen.getByText("Whole wave")).toBeInTheDocument();
  });

  it("shows each-drop voting power scope", () => {
    renderWaveSpecs({
      wave: makeWave({
        waveType: ApiWaveType.Rank,
        creditScope: ApiWaveCreditScope.Drop,
      }),
    });

    expect(screen.getByText("Voting power")).toBeInTheDocument();
    expect(screen.getByText("Each drop")).toBeInTheDocument();
  });

  it("shows approval threshold settings for approve waves", () => {
    renderWaveSpecs({
      wave: makeWave({
        waveType: ApiWaveType.Approve,
        winningThreshold: 12,
        winningThresholdMinDurationMs: 120_000,
      }),
    });

    expect(screen.getByText("Approval threshold")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Hold time: 2m")).toBeInTheDocument();
    expect(screen.getByText("Tab labels")).toBeInTheDocument();
    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it.each([ApiWaveType.Chat, ApiWaveType.Rank])(
    "hides approve-only settings for %s waves",
    (waveType) => {
      renderWaveSpecs({ wave: makeWave({ waveType }) });

      expect(screen.queryByText("Approval threshold")).not.toBeInTheDocument();
      expect(screen.queryByText("Tab labels")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Edit approval threshold" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Edit tab labels" })
      ).not.toBeInTheDocument();
    }
  );

  it("shows identity submission summaries in the about block when configured", () => {
    renderWaveSpecs({
      wave: makeWave({
        submissionStrategy: {
          type: ApiWaveParticipationSubmissionStrategyType.Identity,
          config: {
            who_can_be_submitted:
              ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
            duplicates:
              ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin,
          },
        },
      }),
    });

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Eligible identities")).toBeInTheDocument();
    expect(screen.getByText("Others only")).toBeInTheDocument();
    expect(screen.getByText("Repeat submissions")).toBeInTheDocument();
    expect(screen.getByText("After it wins")).toBeInTheDocument();
    expect(screen.queryByText("Identity submissions")).not.toBeInTheDocument();
  });

  it("shows approval threshold edit icon only when user can edit wave", () => {
    const { rerender } = renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
      }),
    });

    expect(
      screen.getByRole("button", { name: "Edit approval threshold" })
    ).toBeInTheDocument();

    rerender(
      <WaveSpecs
        wave={makeWave({
          canAdmin: false,
          waveType: ApiWaveType.Approve,
          winningThreshold: 10,
        })}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Edit approval threshold" })
    ).not.toBeInTheDocument();
  });

  it("shows tab label edit icon only when user can edit wave", async () => {
    const { rerender } = renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    expect(
      await screen.findByRole("button", { name: "Edit tab labels" })
    ).toBeInTheDocument();

    rerender(
      <WaveSpecs
        wave={makeWave({
          canAdmin: false,
          waveType: ApiWaveType.Approve,
        })}
      />
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Edit tab labels" })
      ).not.toBeInTheDocument();
    });
  });

  it("opens tab label editor with defaults as blank fields", async () => {
    const user = userEvent.setup();
    renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit tab labels" })
    );

    expect(screen.getByLabelText("Approvals tab label")).toHaveValue("");
    expect(screen.getByLabelText("Approved tab label")).toHaveValue("");
    expect(screen.getByPlaceholderText("Approvals")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Approved")).toBeInTheDocument();
  });

  it("opens tab label editor with custom metadata values", async () => {
    const user = userEvent.setup();
    waveMetadata = [
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "Candidates",
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
        data_value: "Selected",
      },
    ];
    renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit tab labels" })
    );

    expect(screen.getByLabelText("Approvals tab label")).toHaveValue(
      "Candidates"
    );
    expect(screen.getByLabelText("Approved tab label")).toHaveValue("Selected");
  });

  it("saves custom tab label metadata and invalidates metadata", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    await user.click(
      await screen.findByRole("button", { name: "Edit tab labels" })
    );
    await user.type(screen.getByLabelText("Approvals tab label"), "Candidates");

    expect(screen.getByText("Candidates")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createWaveMetadataMock).toHaveBeenCalledWith({
        waveId: "wave-1",
        body: {
          data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
          data_value: "Candidates",
        },
      });
    });
    expect(deleteWaveMetadataMock).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_METADATA, { wave_id: "wave-1" }],
    });
  });

  it("uses defaults by deleting existing tab label metadata", async () => {
    const user = userEvent.setup();
    waveMetadata = [
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "Old",
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvalsTabLabel,
        data_value: "Candidates",
      },
      {
        id: 3,
        data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
        data_value: "Selected",
      },
    ];
    renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit tab labels" })
    );
    await user.click(screen.getByRole("button", { name: "Use defaults" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(deleteWaveMetadataMock).toHaveBeenCalledTimes(3);
    });
    expect(deleteWaveMetadataMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      metadataId: 1,
    });
    expect(deleteWaveMetadataMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      metadataId: 2,
    });
    expect(deleteWaveMetadataMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      metadataId: 3,
    });
    expect(createWaveMetadataMock).not.toHaveBeenCalled();
  });

  it("keeps tab label editor open when metadata save fails", async () => {
    createWaveMetadataMock.mockRejectedValueOnce(new Error("metadata failed"));
    const user = userEvent.setup();
    const { setToast } = renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit tab labels" })
    );
    await user.type(screen.getByLabelText("Approvals tab label"), "Candidates");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith({
        type: "error",
        message: "metadata failed",
      });
    });
    expect(screen.getByLabelText("Approvals tab label")).toBeInTheDocument();
  });

  it("shows tab label validation after editing", async () => {
    const user = userEvent.setup();
    renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit tab labels" })
    );
    await user.type(screen.getByLabelText("Approved tab label"), "Approvals");

    expect(
      screen.getByText("Use two different tab labels.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("saves approval threshold settings", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
        winningThresholdMinDurationMs: 0,
      }),
    });
    const approvalQueryKeys = seedApprovalQueries(queryClient);

    await user.click(
      screen.getByRole("button", { name: "Edit approval threshold" })
    );
    await user.clear(screen.getByLabelText("Approval threshold value"));
    await user.type(screen.getByLabelText("Approval threshold value"), "25");
    await user.selectOptions(
      screen.getByLabelText("Minimum time above threshold unit"),
      "hours"
    );
    await user.type(screen.getByLabelText("Minimum time above threshold"), "2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(commonApiPostMock.mock.calls[0][0].body.wave).toMatchObject({
      winning_threshold: 25,
      winning_threshold_min_duration_ms: 7_200_000,
    });
    await waitFor(() => {
      expectApprovalQueriesInvalidated(queryClient, approvalQueryKeys, true);
    });
  });

  it("does not invalidate approval threshold queries when save fails", async () => {
    commonApiPostMock.mockRejectedValueOnce(new Error("API Error"));
    const user = userEvent.setup();
    const { queryClient } = renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
        winningThresholdMinDurationMs: 0,
      }),
    });
    const approvalQueryKeys = seedApprovalQueries(queryClient);

    await user.click(
      screen.getByRole("button", { name: "Edit approval threshold" })
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.getByLabelText("Approval threshold value")
      ).not.toBeDisabled()
    );
    expectApprovalQueriesInvalidated(queryClient, approvalQueryKeys, false);
  });

  it("saves blank approval threshold min time as immediate", async () => {
    const user = userEvent.setup();
    renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
        winningThresholdMinDurationMs: 120_000,
      }),
    });

    await user.click(
      screen.getByRole("button", { name: "Edit approval threshold" })
    );
    await user.clear(screen.getByLabelText("Minimum time above threshold"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(commonApiPostMock.mock.calls[0][0].body.wave).toMatchObject({
      winning_threshold: 10,
      winning_threshold_min_duration_ms: 0,
    });
  });

  it("does not submit invalid approval threshold settings", async () => {
    const user = userEvent.setup();
    renderWaveSpecs({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
      }),
    });

    await user.click(
      screen.getByRole("button", { name: "Edit approval threshold" })
    );
    await user.clear(screen.getByLabelText("Approval threshold value"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(commonApiPostMock).not.toHaveBeenCalled();
  });
});
