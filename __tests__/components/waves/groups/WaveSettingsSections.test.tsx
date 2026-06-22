import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import WaveSettingsSections from "@/components/waves/groups/WaveSettingsSections";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
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

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));
jest.mock("@/services/api/waves-v2-api", () => ({
  createWaveMetadata: jest.fn(),
  deleteWaveMetadata: jest.fn(),
  fetchWaveMetadata: jest.fn(),
}));
jest.mock(
  "@/components/waves/groups/curation/WaveActiveCurationSection",
  () => ({
    __esModule: true,
    default: () => <div data-testid="curation-section">Curation</div>,
  })
);
jest.mock("@/components/waves/specs/groups/group/WaveGroup", () => {
  const { WaveGroupType } = jest.requireActual(
    "@/components/waves/specs/groups/group/WaveGroup.types"
  );
  return {
    __esModule: true,
    default: (props: any) => <div data-testid={`group-${props.type}`} />,
    WaveGroupType,
  };
});

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
    submission_strategy: null,
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

const renderSettings = ({
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
    ...render(<WaveSettingsSections wave={wave} />, { wrapper: Providers }),
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

describe("WaveSettingsSections", () => {
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

  it("renders compact settings sections", () => {
    renderSettings({
      wave: makeWave({
        waveType: ApiWaveType.Approve,
        winningThreshold: 12,
        winningThresholdMinDurationMs: 120_000,
      }),
    });

    expect(screen.getByText("Approval tabs")).toBeInTheDocument();
    expect(screen.getByText("Display")).toBeInTheDocument();
    expect(screen.getByText("Approval rule")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Access")).toBeInTheDocument();
    expect(screen.getByText("Approvals tab")).toBeInTheDocument();
    expect(screen.getByText("Approved tab")).toBeInTheDocument();
    expect(screen.getByText("Outcomes")).toBeInTheDocument();
    expect(screen.getByText("Shown")).toBeInTheDocument();
    expect(screen.getByText("Approve after")).toBeInTheDocument();
    expect(screen.getByText("12 approvals")).toBeInTheDocument();
    expect(screen.getByText("Hold time")).toBeInTheDocument();
    expect(screen.getByText("2m")).toBeInTheDocument();
  });

  it("keeps approve-only settings out of rank waves", () => {
    renderSettings({ wave: makeWave({ waveType: ApiWaveType.Rank }) });

    expect(screen.getByText("Display")).toBeInTheDocument();
    expect(screen.getByText("Outcomes")).toBeInTheDocument();
    expect(screen.queryByText("Approval tabs")).not.toBeInTheDocument();
    expect(screen.queryByText("Approvals tab")).not.toBeInTheDocument();
    expect(screen.queryByText("Approval rule")).not.toBeInTheDocument();
    expect(screen.queryByText("Approve after")).not.toBeInTheDocument();
    expect(fetchWaveMetadataMock).toHaveBeenCalledWith({ waveId: "wave-1" });
  });

  it("shows outcome visibility as read-only for non-admins", async () => {
    waveMetadata = [
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
        data_value: "false",
      },
    ];

    renderSettings({
      wave: makeWave({
        canAdmin: false,
        waveType: ApiWaveType.Rank,
      }),
    });

    expect(await screen.findByText("Hidden")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit outcome visibility" })
    ).not.toBeInTheDocument();
  });

  it("saves hidden outcome visibility metadata", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Rank,
      }),
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    await user.click(
      await screen.findByRole("button", { name: "Edit outcome visibility" })
    );
    await user.click(screen.getByLabelText("Show outcomes"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createWaveMetadataMock).toHaveBeenCalledWith({
        waveId: "wave-1",
        body: {
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "false",
        },
      });
    });
    expect(deleteWaveMetadataMock).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_METADATA, { wave_id: "wave-1" }],
    });
  });

  it("deletes outcome visibility metadata when reset to shown", async () => {
    const user = userEvent.setup();
    waveMetadata = [
      {
        id: 1,
        data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
        data_value: "hidden",
      },
      {
        id: 2,
        data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
        data_value: "false",
      },
    ];
    renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    expect(await screen.findByText("Hidden")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Edit outcome visibility" })
    );
    await user.click(screen.getByLabelText("Show outcomes"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(deleteWaveMetadataMock).toHaveBeenCalledTimes(2);
    });
    expect(deleteWaveMetadataMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      metadataId: 1,
    });
    expect(deleteWaveMetadataMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      metadataId: 2,
    });
    expect(createWaveMetadataMock).not.toHaveBeenCalled();
  });

  it("shows approve labels as read-only for non-admins", async () => {
    renderSettings({
      wave: makeWave({
        canAdmin: false,
        waveType: ApiWaveType.Approve,
      }),
    });

    expect(screen.getByText("Approvals tab")).toBeInTheDocument();
    expect(screen.getByText("Approved tab")).toBeInTheDocument();
    expect(screen.getByText("Proposals")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Edit approvals tab label" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Edit approved tab label" })
      ).not.toBeInTheDocument();
    });
  });

  it("formats singular approval count", () => {
    renderSettings({
      wave: makeWave({
        waveType: ApiWaveType.Approve,
        winningThreshold: 1,
      }),
    });

    expect(screen.getByText("1 approval")).toBeInTheDocument();
  });

  it("shows edit buttons only when user can edit wave", async () => {
    const { rerender } = renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
      }),
    });

    expect(
      screen.getByRole("button", { name: "Edit approve after" })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Edit approvals tab label" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit approved tab label" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit hold time" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Edit approve after" })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Edit approvals tab label" })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Edit approved tab label" })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Edit hold time" })
    ).toHaveLength(1);

    rerender(
      <WaveSettingsSections
        wave={makeWave({
          canAdmin: false,
          waveType: ApiWaveType.Approve,
          winningThreshold: 10,
        })}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Edit approve after" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit hold time" })
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Edit approvals tab label" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Edit approved tab label" })
      ).not.toBeInTheDocument();
    });
  });

  it("opens tab label editor with defaults as blank fields", async () => {
    const user = userEvent.setup();
    renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit approvals tab label" })
    );

    expect(screen.getByLabelText("Approvals tab label")).toHaveValue("");
    expect(
      screen.queryByLabelText("Approved tab label")
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Proposals")).toBeInTheDocument();
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
    renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit approved tab label" })
    );

    expect(
      screen.queryByLabelText("Approvals tab label")
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Approved tab label")).toHaveValue("Selected");
  });

  it("saves custom tab label metadata and invalidates metadata", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    await user.click(
      await screen.findByRole("button", { name: "Edit approvals tab label" })
    );
    await user.type(screen.getByLabelText("Approvals tab label"), "Candidates");
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

  it("saves custom approved tab label metadata", async () => {
    const user = userEvent.setup();
    renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit approved tab label" })
    );
    await user.type(screen.getByLabelText("Approved tab label"), "Selected");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createWaveMetadataMock).toHaveBeenCalledWith({
        waveId: "wave-1",
        body: {
          data_key: WAVE_DISPLAY_METADATA_KEYS.approvedTabLabel,
          data_value: "Selected",
        },
      });
    });
    expect(createWaveMetadataMock).toHaveBeenCalledTimes(1);
    expect(deleteWaveMetadataMock).not.toHaveBeenCalled();
  });

  it("uses default by deleting existing metadata for one tab label", async () => {
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
    renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit approvals tab label" })
    );
    await user.click(screen.getByRole("button", { name: "Use default" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(deleteWaveMetadataMock).toHaveBeenCalledTimes(2);
    });
    expect(deleteWaveMetadataMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      metadataId: 1,
    });
    expect(deleteWaveMetadataMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      metadataId: 2,
    });
    expect(createWaveMetadataMock).not.toHaveBeenCalled();
  });

  it("keeps tab label editor open when metadata save fails", async () => {
    createWaveMetadataMock.mockRejectedValueOnce(new Error("metadata failed"));
    const user = userEvent.setup();
    const { setToast } = renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit approvals tab label" })
    );
    await user.type(screen.getByLabelText("Approvals tab label"), "Candidates");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.stringMatching(/metadata failed/i),
          title: expect.stringMatching(/save these tab labels/i),
          type: "error",
        })
      );
    });
    expect(screen.getByLabelText("Approvals tab label")).toBeInTheDocument();
  });

  it("shows tab label validation after editing", async () => {
    const user = userEvent.setup();
    renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "Edit approved tab label" })
    );
    await user.type(screen.getByLabelText("Approved tab label"), "Proposals");

    expect(
      screen.getByText("Use two different tab labels.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("saves approve-after setting", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
        winningThresholdMinDurationMs: 0,
      }),
    });
    const approvalQueryKeys = seedApprovalQueries(queryClient);

    await user.click(
      screen.getByRole("button", { name: "Edit approve after" })
    );
    await user.clear(screen.getByLabelText("Required approvals"));
    await user.type(screen.getByLabelText("Required approvals"), "25");
    expect(
      screen.queryByLabelText("Minimum time above threshold")
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(commonApiPostMock.mock.calls[0][0].body.wave).toMatchObject({
      winning_threshold: 25,
    });
    await waitFor(() => {
      expectApprovalQueriesInvalidated(queryClient, approvalQueryKeys, true);
    });
  });

  it("saves hold-time setting", async () => {
    const user = userEvent.setup();
    renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
        winningThresholdMinDurationMs: 0,
      }),
    });

    await user.click(screen.getByRole("button", { name: "Edit hold time" }));
    expect(
      screen.queryByLabelText("Required approvals")
    ).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText("Minimum time above threshold unit"),
      "hours"
    );
    await user.type(screen.getByLabelText("Minimum time above threshold"), "2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(commonApiPostMock.mock.calls[0][0].body.wave).toMatchObject({
      winning_threshold_min_duration_ms: 7_200_000,
    });
  });

  it("does not submit invalid approve-after setting", async () => {
    const user = userEvent.setup();
    renderSettings({
      wave: makeWave({
        canAdmin: true,
        waveType: ApiWaveType.Approve,
        winningThreshold: 10,
      }),
    });

    await user.click(
      screen.getByRole("button", { name: "Edit approve after" })
    );
    await user.clear(screen.getByLabelText("Required approvals"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(commonApiPostMock).not.toHaveBeenCalled();
  });
});
