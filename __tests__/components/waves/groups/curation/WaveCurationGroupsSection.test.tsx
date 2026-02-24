import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveCurationGroupsSection from "@/components/waves/groups/curation/WaveCurationGroupsSection";
import { AuthContext } from "@/components/auth/Auth";
import {
  ReactQueryWrapperContext,
  QueryKey,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { createPublishedGroupForIdentityChange } from "@/components/waves/specs/groups/group/edit/buttons/utils/identityGroupWorkflow";

jest.mock("@tanstack/react-query", () => ({
  useQueries: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock(
  "@/components/waves/specs/groups/group/edit/buttons/utils/identityGroupWorkflow",
  () => ({
    createPublishedGroupForIdentityChange: jest.fn(),
    IdentityGroupWorkflowMode: {
      INCLUDE: "include",
      EXCLUDE: "exclude",
    },
  })
);

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

jest.mock("@/components/compact-menu", () => ({
  CompactMenu: ({
    items,
  }: {
    items: Array<{ id: string; label: string; onSelect: () => void }>;
  }) => (
    <div>
      {items.map((item) => (
        <button type="button" key={item.id} onClick={item.onSelect}>
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock("@/components/utils/select-group/SelectGroupModalWrapper", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onGroupSelect,
  }: {
    isOpen: boolean;
    onGroupSelect: (group: any) => void;
  }) =>
    isOpen ? (
      <button
        type="button"
        onClick={() => onGroupSelect({ id: "group-2", name: "Group Two" })}
      >
        Select group
      </button>
    ) : null,
}));

jest.mock(
  "@/components/waves/specs/groups/group/edit/WaveGroupRemoveModal",
  () => ({
    __esModule: true,
    default: ({ removeGroup }: { removeGroup: () => void }) => (
      <button type="button" onClick={removeGroup}>
        Confirm remove
      </button>
    ),
  })
);

jest.mock(
  "@/components/waves/specs/groups/group/edit/WaveGroupManageIdentitiesModal",
  () => ({
    __esModule: true,
    WaveGroupManageIdentitiesMode: {
      INCLUDE: "INCLUDE",
      EXCLUDE: "EXCLUDE",
    },
    default: ({
      mode,
      onConfirm,
    }: {
      mode: "INCLUDE" | "EXCLUDE";
      onConfirm: (event: {
        identity: string;
        mode: "INCLUDE" | "EXCLUDE";
      }) => void;
    }) => (
      <button
        type="button"
        onClick={() => onConfirm({ identity: "0xabc", mode })}
      >
        Confirm identity update
      </button>
    ),
  })
);

const mockUseQuery = useQuery as jest.Mock;
const mockUseQueries = useQueries as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockCommonApiPost = commonApiPost as jest.Mock;
const mockCommonApiDelete = commonApiDelete as jest.Mock;
const mockCreatePublishedGroupForIdentityChange =
  createPublishedGroupForIdentityChange as jest.Mock;

const invalidateQueries = jest.fn();
const onWaveCreated = jest.fn();
const setToast = jest.fn();
const requestAuth = jest.fn().mockResolvedValue({ success: true });

const baseWave = {
  id: "wave-1",
  name: "Wave One",
  author: { handle: "simo" },
  wave: {
    type: ApiWaveType.Rank,
    authenticated_user_eligible_for_admin: true,
  },
} as any;

const renderSection = (wave = baseWave) =>
  render(
    <AuthContext.Provider
      value={{
        connectedProfile: { id: "1", handle: "simo" } as any,
        fetchingProfile: false,
        connectionStatus: "CONNECTED" as any,
        receivedProfileProxies: [],
        activeProfileProxy: null,
        showWaves: true,
        requestAuth,
        setToast,
        setActiveProfileProxy: jest.fn(),
      }}
    >
      <ReactQueryWrapperContext.Provider
        value={{
          setProfile: jest.fn(),
          setWave: jest.fn(),
          setWavesOverviewPage: jest.fn(),
          setWaveDrops: jest.fn(),
          setProfileProxy: jest.fn(),
          onProfileProxyModify: jest.fn(),
          onProfileCICModify: jest.fn(),
          onProfileRepModify: jest.fn(),
          onProfileEdit: jest.fn(),
          onProfileStatementAdd: jest.fn(),
          onProfileStatementRemove: jest.fn(),
          onIdentityFollowChange: jest.fn(),
          initProfileRepPage: jest.fn(),
          initCommunityActivityPage: jest.fn(),
          waitAndInvalidateDrops: jest.fn(),
          addOptimisticDrop: jest.fn(),
          invalidateDrops: jest.fn(),
          onGroupRemoved: jest.fn(),
          onGroupChanged: jest.fn(),
          onGroupCreate: jest.fn(),
          onIdentityBulkRate: jest.fn(),
          onWaveCreated,
          onWaveFollowChange: jest.fn(),
          invalidateAll: jest.fn(),
          invalidateNotifications: jest.fn(),
          invalidateIdentityTdhStats: jest.fn(),
        }}
      >
        <WaveCurationGroupsSection wave={wave} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockUseQueryClient.mockReturnValue({
    invalidateQueries,
  });
  mockUseQuery.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  });
  mockUseQueries.mockReturnValue([]);
  mockCommonApiPost.mockResolvedValue({});
  mockCommonApiDelete.mockResolvedValue(undefined);
  mockCreatePublishedGroupForIdentityChange.mockResolvedValue("group-new");
});

describe("WaveCurationGroupsSection", () => {
  it("does not render for chat waves", () => {
    const chatWave = {
      ...baseWave,
      wave: { ...baseWave.wave, type: ApiWaveType.Chat },
    };

    const { container } = renderSection(chatWave);
    expect(container).toBeEmptyDOMElement();
  });

  it("creates curation group from Add group action", async () => {
    const user = userEvent.setup();
    renderSection();

    expect(screen.queryByText("None")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add group" }));
    await user.click(screen.getByRole("button", { name: "Select group" }));

    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "waves/wave-1/curation-groups",
          body: {
            name: "Group Two",
            group_id: "group-2",
          },
        })
      );
    });

    expect(requestAuth).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_CURATION_GROUPS, { wave_id: "wave-1" }],
    });
    expect(onWaveCreated).toHaveBeenCalled();
  });

  it("keeps add action as bottom button only", () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "curation-1",
          name: "Curators One",
          wave_id: "wave-1",
          group_id: "group-1",
          created_at: 1,
          updated_at: 1,
        },
      ],
      isLoading: false,
      isError: false,
    });

    renderSection();

    expect(screen.getAllByRole("button", { name: "Add group" })).toHaveLength(
      1
    );
  });

  it("renders curation group as clickable link when group details are available", () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "curation-1",
          name: "Curators One",
          wave_id: "wave-1",
          group_id: "group-1",
          created_at: 1,
          updated_at: 1,
        },
      ],
      isLoading: false,
      isError: false,
    });
    mockUseQueries.mockReturnValue([
      {
        data: {
          id: "group-1",
          name: "Curators One",
          group: {},
          created_at: 1,
          created_by: { handle: "simo", pfp: "https://example.com/pfp.png" },
          visible: true,
          is_private: false,
        },
      },
    ]);

    renderSection();

    expect(
      screen.getByRole("link", { name: /Curators One/i })
    ).toBeInTheDocument();
  });

  it("renders plain curation text when group details are unavailable", () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "curation-1",
          name: "Curators One",
          wave_id: "wave-1",
          group_id: "group-1",
          created_at: 1,
          updated_at: 1,
        },
      ],
      isLoading: false,
      isError: false,
    });
    mockUseQueries.mockReturnValue([
      {
        isError: true,
      },
    ]);

    renderSection();

    expect(screen.getByText("Curators One")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Curators One/i })
    ).not.toBeInTheDocument();
  });

  it("removes an existing curation group", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "curation-1",
          name: "Curators One",
          wave_id: "wave-1",
          group_id: "group-1",
          created_at: 1,
          updated_at: 1,
        },
      ],
      isLoading: false,
      isError: false,
    });

    renderSection();
    await user.click(screen.getByRole("button", { name: "Remove group" }));
    await user.click(screen.getByRole("button", { name: "Confirm remove" }));

    await waitFor(() => {
      expect(mockCommonApiDelete).toHaveBeenCalledWith({
        endpoint: "waves/wave-1/curation-groups/curation-1",
      });
    });
  });

  it("includes identity and relinks curation group", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "curation-1",
          name: "Curators One",
          wave_id: "wave-1",
          group_id: "group-1",
          created_at: 1,
          updated_at: 1,
        },
      ],
      isLoading: false,
      isError: false,
    });

    renderSection();
    await user.click(screen.getByRole("button", { name: "Include identity" }));
    await user.click(
      screen.getByRole("button", { name: "Confirm identity update" })
    );

    await waitFor(() => {
      expect(mockCreatePublishedGroupForIdentityChange).toHaveBeenCalledWith(
        expect.objectContaining({
          waveId: "wave-1",
          waveName: "Wave One",
          groupLabel: "Curation",
          scopedGroupId: "group-1",
          identity: "0xabc",
          mode: "include",
        })
      );
    });

    expect(mockCommonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "waves/wave-1/curation-groups/curation-1",
        body: {
          name: "Curators One",
          group_id: "group-new",
        },
      })
    );
  });
});
