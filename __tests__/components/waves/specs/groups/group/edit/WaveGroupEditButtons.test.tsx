import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import WaveGroupEditButtons from "@/components/waves/specs/groups/group/edit/WaveGroupEditButtons";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";

const mockSubmitInlineGroup = jest.fn();
const mockValidateWaveGroups = jest.fn();
const mockHideUnattachedClone = jest.fn();
const mockUseWaveGroupCriteria = jest.fn();
const mockConvertWaveToUpdateWave = jest.fn();
let mockInlinePanelProps: any;

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useMutation: jest.fn(),
    useQuery: jest.fn(),
    useQueryClient: jest.fn(),
  };
});

jest.mock("focus-trap-react", () => ({
  FocusTrap: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/hooks/groups/useGroupMutations", () => ({
  useGroupMutations: () => ({ submit: mockSubmitInlineGroup }),
}));

jest.mock("@/services/api/wave-group-validation-api", () => ({
  validateWaveGroups: (...args: any[]) => mockValidateWaveGroups(...args),
}));

jest.mock(
  "@/components/waves/specs/groups/group/edit/hooks/useWaveGroupCriteria",
  () => ({
    useWaveGroupCriteria: (groupId: string | null) =>
      mockUseWaveGroupCriteria(groupId),
  })
);

jest.mock(
  "@/components/waves/specs/groups/group/edit/buttons/utils/waveGroupCloneRecovery",
  () => ({
    getCloneReferenceState: jest.fn().mockResolvedValue("unattached"),
    hideUnattachedClone: (...args: any[]) => mockHideUnattachedClone(...args),
  })
);

jest.mock("@/helpers/waves/waves.helpers", () => ({
  convertWaveToUpdateWave: (...args: any[]) =>
    mockConvertWaveToUpdateWave(...args),
}));

jest.mock(
  "@/components/groups/assignment/GroupAssignmentDialog",
  () =>
    function MockGroupAssignmentDialog(props: any) {
      mockInlinePanelProps = props;
      const selectedGroup = createFullGroup("selected-group", { level: 10 });
      const payload = {
        name: "Draft Group",
        group: props.selectedGroup?.group ?? {},
        is_private: true,
      };

      return (
        <div data-testid="inline-panel" data-start-mode={props.startMode}>
          {props.beforePanel}
          <span>{props.selectedGroup?.name ?? props.defaultLabel}</span>
          <button
            type="button"
            onClick={() => {
              void props.onChange(selectedGroup);
            }}
          >
            select existing group
          </button>
          <button
            type="button"
            onClick={() => {
              void (async () => {
                const group = await props.onCreateGroup(payload);
                if (group) {
                  await props.onChange(group);
                }
              })();
            }}
          >
            save edited criteria
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog",
  () =>
    function MockConfirmationDialog(props: any) {
      return props.isOpen ? (
        <div role="alertdialog" aria-label={props.title}>
          <p>{props.message}</p>
          <button
            type="button"
            disabled={props.confirmDisabled || props.isConfirming}
            onClick={props.onConfirm}
          >
            {props.confirmText}
          </button>
          <button type="button" onClick={props.onClose}>
            {props.cancelText}
          </button>
        </div>
      ) : null;
    }
);

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

function createFullGroup(
  id: string,
  { level = null }: { readonly level?: number | null } = {}
): ApiGroupFull {
  return {
    id,
    name: id,
    group: {
      tdh: {
        min: null,
        max: null,
        inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
      },
      rep: {
        min: null,
        max: null,
        direction: ApiGroupFilterDirection.Received,
        user_identity: null,
        category: null,
      },
      cic: {
        min: null,
        max: null,
        direction: ApiGroupFilterDirection.Received,
        user_identity: null,
      },
      level: { min: level, max: null },
      owns_nfts: [],
      identity_group_id: "included-wallets",
      identity_group_identities_count: 1,
      excluded_identity_group_id: "excluded-wallets",
      excluded_identity_group_identities_count: 1,
      is_beneficiary_of_grant_id: null,
      is_beneficiary_of_grant_match_mode:
        ApiGroupBeneficiaryGrantMatchMode.AnyToken,
      is_beneficiary_of_grant: null,
    },
    created_at: 1,
    created_by: { id: "profile-1", handle: "alice" } as any,
    visible: true,
    is_private: false,
    is_direct_message: false,
  };
}

const groupSummaries = {
  visibility: {
    id: "visibility-group",
    name: "Visibility Group",
    author: { id: "profile-1", handle: "alice" },
  },
  drop: {
    id: "drop-group",
    name: "Drop Group",
    author: { id: "profile-1", handle: "alice" },
  },
  vote: {
    id: "vote-group",
    name: "Vote Group",
    author: { id: "profile-1", handle: "alice" },
  },
  chat: {
    id: "chat-group",
    name: "Chat Group",
    author: { id: "profile-1", handle: "alice" },
  },
  admin: {
    id: "admin-group",
    name: "Admin Group",
    author: { id: "profile-1", handle: "alice" },
  },
};

const wave: any = {
  id: "w1",
  name: "Wave 1",
  visibility: { scope: { group: groupSummaries.visibility } },
  participation: {
    scope: { group: groupSummaries.drop },
    authenticated_user_eligible: true,
  },
  voting: {
    scope: { group: groupSummaries.vote },
    authenticated_user_eligible: true,
  },
  chat: {
    scope: { group: groupSummaries.chat },
    authenticated_user_eligible: true,
  },
  wave: {
    admin_group: { group: groupSummaries.admin },
    authenticated_user_eligible_for_admin: true,
    type: "RANK",
  },
};

const mutateAsync = jest.fn();
const auth = {
  setToast: jest.fn(),
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  connectedProfile: {
    id: "profile-1",
    handle: "alice",
    normalised_handle: "alice",
    primary_wallet: "0xME",
    display: "Alice",
    tdh: 1,
    level: 1,
    cic: 1,
    pfp: null,
  },
} as any;
const onWaveCreated = jest.fn();
const wrapper = ({ children }: { readonly children: React.ReactNode }) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider
      value={{ onWaveCreated, onGroupCreate: jest.fn() } as any}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

describe("WaveGroupEditButtons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInlinePanelProps = null;
    auth.requestAuth.mockResolvedValue({ success: true });
    mutateAsync.mockResolvedValue({});
    mockConvertWaveToUpdateWave.mockReturnValue({
      name: "Wave 1",
      picture: null,
      visibility: { scope: { group_id: "visibility-group" } },
      participation: { scope: { group_id: "drop-group" } },
      voting: { scope: { group_id: "vote-group" } },
      chat: { scope: { group_id: "chat-group" } },
      wave: { admin_group: { group_id: "admin-group" } },
    });
    (useMutation as jest.Mock).mockReturnValue({ mutateAsync });
    (useQuery as jest.Mock).mockReturnValue({ data: undefined });
    (useQueryClient as jest.Mock).mockReturnValue({
      ensureQueryData: jest.fn(),
      fetchQuery: jest.fn(),
    });
    mockValidateWaveGroups.mockResolvedValue({
      valid: true,
      invalid_roles: [],
    });
    mockSubmitInlineGroup.mockResolvedValue({
      ok: true,
      group: createFullGroup("created-group", { level: 5 }),
      published: true,
    });
    mockUseWaveGroupCriteria.mockImplementation((groupId: string | null) => ({
      criteria:
        groupId === null
          ? { group: null, includedWallets: [], excludedWallets: [] }
          : {
              group: createFullGroup(groupId, {
                level: groupId === "visibility-group" ? 1 : 2,
              }),
              includedWallets: ["0xincluded"],
              excludedWallets: ["0xexcluded"],
            },
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    }));
  });

  it("opens the prefilled editor directly from the gear without a context menu", () => {
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.VIEW} />, {
      wrapper,
    });

    expect(screen.queryByText("Change group")).not.toBeInTheDocument();
    expect(screen.queryByText("Include identity")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Edit Visibility access" })
    );

    expect(screen.getByTestId("inline-panel")).toHaveAttribute(
      "data-start-mode",
      "criteria"
    );
    expect(mockInlinePanelProps.selectedGroup).toEqual(
      expect.objectContaining({ id: "visibility-group" })
    );
    expect(mockInlinePanelProps.selectedGroupIncludedWallets).toEqual([
      "0xincluded",
    ]);
    expect(mockInlinePanelProps.selectedGroupExcludedWallets).toEqual([
      "0xexcluded",
    ]);
  });

  it("defaults to explicitly including the editor for a public access row", () => {
    const publicVisibilityWave = {
      ...wave,
      visibility: { scope: { group: null } },
    };
    render(
      <WaveGroupEditButtons
        wave={publicVisibilityWave}
        type={WaveGroupType.VIEW}
      />,
      { wrapper }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Edit Visibility access" })
    );

    expect(mockInlinePanelProps.selectedGroup).toBeNull();
    expect(mockInlinePanelProps.defaultIncludedIdentity).toEqual(
      expect.objectContaining({
        profile_id: "profile-1",
        wallet: "0xME",
      })
    );
  });

  it("creates a copy and updates only the edited access row", async () => {
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.CHAT} />, {
      wrapper,
    });
    fireEvent.click(screen.getByRole("button", { name: "Edit Chat access" }));
    fireEvent.click(screen.getByText("save edited criteria"));

    await waitFor(() => expect(mockSubmitInlineGroup).toHaveBeenCalled());
    expect(mockSubmitInlineGroup.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          name: "Draft Group",
          is_private: true,
        }),
      })
    );
    expect(mockSubmitInlineGroup.mock.calls[0][0]).not.toHaveProperty(
      "previousGroup"
    );
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        visibility: { scope: { group_id: "visibility-group" } },
        participation: { scope: { group_id: "drop-group" } },
        voting: { scope: { group_id: "vote-group" } },
        chat: { scope: { group_id: "created-group" } },
        wave: { admin_group: { group_id: "admin-group" } },
      })
    );
  });

  it("restricts every public non-admin access row when Visibility changes", async () => {
    const fullyPublicWave = {
      ...wave,
      visibility: { scope: { group: null } },
      participation: {
        ...wave.participation,
        scope: { group: null },
      },
      voting: { ...wave.voting, scope: { group: null } },
      chat: { ...wave.chat, scope: { group: null } },
    };
    mockConvertWaveToUpdateWave.mockReturnValue({
      name: "Wave 1",
      picture: null,
      visibility: { scope: { group_id: null } },
      participation: { scope: { group_id: null } },
      voting: { scope: { group_id: null } },
      chat: { enabled: true, scope: { group_id: null } },
      wave: { type: "RANK", admin_group: { group_id: "admin-group" } },
    });

    render(
      <WaveGroupEditButtons wave={fullyPublicWave} type={WaveGroupType.VIEW} />,
      { wrapper }
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Edit Visibility access" })
    );
    fireEvent.click(screen.getByText("select existing group"));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        visibility: { scope: { group_id: "selected-group" } },
        participation: { scope: { group_id: "selected-group" } },
        voting: { scope: { group_id: "selected-group" } },
        chat: {
          enabled: true,
          scope: { group_id: "selected-group" },
        },
        wave: {
          type: "RANK",
          admin_group: { group_id: "admin-group" },
        },
      })
    );
  });

  it("changes only Visibility when another non-admin row is restricted", async () => {
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.VIEW} />, {
      wrapper,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Edit Visibility access" })
    );
    fireEvent.click(screen.getByText("select existing group"));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        visibility: { scope: { group_id: "selected-group" } },
        participation: { scope: { group_id: "drop-group" } },
        voting: { scope: { group_id: "vote-group" } },
        chat: { scope: { group_id: "chat-group" } },
        wave: { admin_group: { group_id: "admin-group" } },
      })
    );
  });

  it("keeps the editor open and hides its unattached copy when validation fails", async () => {
    mockValidateWaveGroups.mockResolvedValueOnce({
      valid: false,
      invalid_roles: ["CHAT"],
    });
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.CHAT} />, {
      wrapper,
    });
    fireEvent.click(screen.getByRole("button", { name: "Edit Chat access" }));
    fireEvent.click(screen.getByText("save edited criteria"));

    await waitFor(() => expect(mockHideUnattachedClone).toHaveBeenCalled());
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId("inline-panel")).toBeInTheDocument();
  });

  it("keeps the editor open when authentication fails before selecting a group", async () => {
    auth.requestAuth.mockResolvedValueOnce({ success: false });
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.CHAT} />, {
      wrapper,
    });
    fireEvent.click(screen.getByRole("button", { name: "Edit Chat access" }));
    fireEvent.click(screen.getByText("select existing group"));

    await waitFor(() => expect(auth.setToast).toHaveBeenCalled());
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId("inline-panel")).toBeInTheDocument();
  });

  it("disables access shortcuts while a wave update is pending", async () => {
    const pendingMutation = createDeferredPromise<object>();
    mutateAsync.mockImplementationOnce(() => pendingMutation.promise);
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.VIEW} />, {
      wrapper,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Edit Visibility access" })
    );
    fireEvent.click(screen.getByText("select existing group"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Make wave public" })
      ).toBeDisabled();
    });

    pendingMutation.resolve({});
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
  });

  it("makes Visibility public only after confirmation", async () => {
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.VIEW} />, {
      wrapper,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Edit Visibility access" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Make wave public" }));

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Make wave public?" })
    ).toBeInTheDocument();
    fireEvent.click(
      screen
        .getByRole("alertdialog", { name: "Make wave public?" })
        .querySelector("button")!
    );

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].visibility.scope.group_id).toBeNull();
    expect(mutateAsync.mock.calls[0][0].chat.scope.group_id).toBe("chat-group");
  });

  it("matches a non-admin access row to Visibility only after confirmation", async () => {
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.DROP} />, {
      wrapper,
    });
    fireEvent.click(screen.getByRole("button", { name: "Edit Drop access" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Use visibility criteria" })
    );

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: "Use visibility criteria?" })
    ).toBeInTheDocument();
    fireEvent.click(
      screen
        .getByRole("alertdialog", { name: "Use visibility criteria?" })
        .querySelector("button")!
    );

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].participation.scope.group_id).toBe(
      "visibility-group"
    );
    expect(mutateAsync.mock.calls[0][0].voting.scope.group_id).toBe(
      "vote-group"
    );
  });

  it("does not offer the Visibility shortcut to Admins", () => {
    render(<WaveGroupEditButtons wave={wave} type={WaveGroupType.ADMIN} />, {
      wrapper,
    });
    fireEvent.click(screen.getByRole("button", { name: "Edit Admins access" }));

    expect(
      screen.queryByRole("button", { name: "Use visibility criteria" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Make wave public" })
    ).not.toBeInTheDocument();
  });
});
