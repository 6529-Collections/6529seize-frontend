import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WaveGroupEditButtons from "@/components/waves/specs/groups/group/edit/WaveGroupEditButtons";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const mockSubmitInlineGroup = jest.fn();
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
  useGroupMutations: () => ({
    submit: mockSubmitInlineGroup,
  }),
}));

jest.mock("@/helpers/waves/waves.helpers", () => ({
  convertWaveToUpdateWave: jest.fn(() => ({
    name: "Wave 1",
    picture: null,
    visibility: { scope: { group_id: "group-1" } },
    participation: { scope: { group_id: "group-1" } },
    voting: { scope: { group_id: "group-1" } },
    chat: { scope: { group_id: "group-1" } },
    wave: { admin_group: { group_id: "group-1" } },
  })),
}));

jest.mock(
  "@/components/groups/assignment/GroupAssignmentDialog",
  () =>
    function MockGroupAssignmentDialog(props: any) {
      mockInlinePanelProps = props;
      const selectedGroup = {
        id: "group-2",
        name: "Selected Group",
      };
      const payload = {
        name: "Draft Group",
        group: {},
        is_private: false,
      };

      return (
        <div
          data-testid="inline-panel"
          data-allow-clear={String(props.allowGroupClear)}
        >
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
            create inline group
          </button>
          <button
            type="button"
            onClick={() => {
              void props.onChange(null);
            }}
          >
            clear group
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/waves/specs/groups/group/edit/WaveGroupEditButton",
  () => {
    const React = require("react");

    function MockWaveGroupEditTrigger({ open, renderTrigger }: any) {
      if (renderTrigger === null) {
        return null;
      }

      if (renderTrigger) {
        const Trigger = renderTrigger;
        return <Trigger open={open} />;
      }

      return <button onClick={open}>edit</button>;
    }

    return {
      __esModule: true,
      default: React.forwardRef(({ onWaveUpdate, renderTrigger }: any, ref) => {
        const handleOpen = () => onWaveUpdate({});
        React.useImperativeHandle(ref, () => ({ open: handleOpen }), [
          handleOpen,
        ]);
        return (
          <MockWaveGroupEditTrigger
            open={handleOpen}
            renderTrigger={renderTrigger}
          />
        );
      }),
    };
  }
);

jest.mock(
  "@/components/waves/specs/groups/group/edit/WaveGroupRemoveButton",
  () => {
    const React = require("react");

    function MockWaveGroupRemoveTrigger({ open, renderTrigger }: any) {
      if (renderTrigger === null) {
        return null;
      }

      if (renderTrigger) {
        const Trigger = renderTrigger;
        return <Trigger open={open} />;
      }

      return <button onClick={open}>remove</button>;
    }

    return {
      __esModule: true,
      default: React.forwardRef(({ onWaveUpdate, renderTrigger }: any, ref) => {
        const handleOpen = () => onWaveUpdate({});
        React.useImperativeHandle(ref, () => ({ open: handleOpen }), [
          handleOpen,
        ]);
        return (
          <MockWaveGroupRemoveTrigger
            open={handleOpen}
            renderTrigger={renderTrigger}
          />
        );
      }),
    };
  }
);

jest.mock(
  "@/components/waves/specs/groups/group/edit/WaveGroupManageIdentitiesModal",
  () => ({
    __esModule: true,
    WaveGroupManageIdentitiesMode: {
      INCLUDE: "INCLUDE",
      EXCLUDE: "EXCLUDE",
    },
    default: ({ mode, onClose }: any) => (
      <div data-testid={`${mode.toLowerCase()}-modal`}>
        <button onClick={onClose}>close</button>
      </div>
    ),
  })
);

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

const mutateAsync = jest.fn();
const createQueryClientMock = () => ({
  setQueryData: jest.fn(),
  ensureQueryData: jest.fn().mockImplementation(async ({ queryFn }: any) => {
    return queryFn ? await queryFn({ signal: undefined }) : undefined;
  }),
  fetchQuery: jest.fn().mockImplementation(async ({ queryFn }: any) => {
    return queryFn ? await queryFn({ signal: undefined }) : undefined;
  }),
});

let queryClientMock = createQueryClientMock();

const auth = {
  setToast: jest.fn(),
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  connectedProfile: { id: "profile-1", handle: "alice" },
} as any;

const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider value={{ onWaveCreated: jest.fn() }}>
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

const baseGroup = {
  id: "group-1",
  name: "Group 1",
  author: { id: "profile-1", handle: "alice" },
  created_at: Date.now(),
  is_hidden: false,
  is_direct_message: false,
};

const wave: any = {
  id: "w1",
  visibility: { scope: { group: baseGroup } },
  participation: {
    scope: { group: baseGroup },
    authenticated_user_eligible: true,
  },
  voting: {
    scope: { group: baseGroup },
    authenticated_user_eligible: true,
  },
  chat: {
    scope: { group: baseGroup },
    authenticated_user_eligible: true,
  },
  wave: {
    admin_group: { group: baseGroup },
    authenticated_user_eligible_for_admin: true,
    type: "RANK",
  },
};

describe("WaveGroupEditButtons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInlinePanelProps = null;
    mockSubmitInlineGroup.mockResolvedValue({
      ok: true,
      group: {
        id: "group-created",
        name: "Created Group",
      },
      published: true,
    });
    auth.requestAuth.mockResolvedValue({ success: true });
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({});
    queryClientMock = createQueryClientMock();
    (useMutation as jest.Mock).mockReturnValue({ mutateAsync });
    (useQuery as jest.Mock).mockReturnValue({ data: undefined });
    (useQueryClient as jest.Mock).mockReturnValue(queryClientMock);
  });

  it("opens inline group dialog from change group", async () => {
    render(
      <WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.VIEW} />,
      { wrapper }
    );
    fireEvent.click(screen.getByRole("button", { name: /Group options/i }));
    fireEvent.click(screen.getByText("Change group"));

    expect(screen.getByTestId("inline-panel")).toHaveAttribute(
      "data-allow-clear",
      "false"
    );
    expect(screen.getByText("Group 1")).toBeInTheDocument();
    expect(mockInlinePanelProps.selectedGroup).toEqual(
      expect.objectContaining({
        id: "group-1",
        name: "Group 1",
        group: expect.objectContaining({
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
          level: { min: null, max: null },
          owns_nfts: [],
          identity_group_id: null,
          identity_group_identities_count: 0,
          excluded_identity_group_id: null,
          excluded_identity_group_identities_count: 0,
          is_beneficiary_of_grant_id: null,
          is_beneficiary_of_grant: null,
        }),
      })
    );
  });

  it("provides a safe created_by fallback for groups without authors", async () => {
    const groupWithoutAuthor = {
      id: "group-without-author",
      name: "Group Without Author",
      created_at: 100,
      is_hidden: false,
      is_direct_message: false,
    };
    const waveWithAuthorlessGroup = {
      ...wave,
      visibility: {
        scope: { group: groupWithoutAuthor },
      },
    };

    render(
      <WaveGroupEditButtons
        haveGroup
        wave={waveWithAuthorlessGroup}
        type={WaveGroupType.VIEW}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByRole("button", { name: /Group options/i }));
    fireEvent.click(screen.getByText("Change group"));

    expect(mockInlinePanelProps.selectedGroup).toEqual(
      expect.objectContaining({
        id: "group-without-author",
        name: "Group Without Author",
        created_by: {
          id: "unknown",
          handle: null,
          pfp: null,
          banner1_color: null,
          banner2_color: null,
          cic: 0,
          rep: 0,
          tdh: 0,
          tdh_rate: 0,
          xtdh: 0,
          xtdh_rate: 0,
          level: 0,
          primary_address: "",
          subscribed_actions: [],
          archived: false,
          active_main_stage_submission_ids: [],
          winner_main_stage_drop_ids: [],
          artist_of_prevote_cards: [],
          profile_wave_id: null,
          is_wave_creator: false,
        },
      })
    );
  });

  it("updates the wave when selecting an existing group", async () => {
    render(
      <WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.VIEW} />,
      { wrapper }
    );
    fireEvent.click(screen.getByRole("button", { name: /Group options/i }));
    fireEvent.click(screen.getByText("Change group"));
    fireEvent.click(screen.getByText("select existing group"));

    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalled();
    expect(mutateAsync.mock.calls[0][0].visibility.scope.group_id).toBe(
      "group-2"
    );
  });

  it("shows error toast when auth fails", async () => {
    auth.requestAuth.mockResolvedValueOnce({ success: false });
    render(
      <WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.VIEW} />,
      { wrapper }
    );
    fireEvent.click(screen.getByRole("button", { name: /Group options/i }));
    fireEvent.click(screen.getByText("Change group"));
    fireEvent.click(screen.getByText("select existing group"));

    await waitFor(() => expect(auth.setToast).toHaveBeenCalled());
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("creates an inline group and attaches it without a second auth prompt", async () => {
    mockSubmitInlineGroup.mockImplementationOnce(async () => {
      await auth.requestAuth();
      return {
        ok: true,
        group: {
          id: "group-created",
          name: "Created Group",
        },
        published: true,
      };
    });

    render(
      <WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.VIEW} />,
      { wrapper }
    );
    fireEvent.click(screen.getByRole("button", { name: /Group options/i }));
    fireEvent.click(screen.getByText("Change group"));
    fireEvent.click(screen.getByText("create inline group"));

    await waitFor(() => expect(mockSubmitInlineGroup).toHaveBeenCalled());
    const submitArgs = mockSubmitInlineGroup.mock.calls[0][0];
    expect(submitArgs).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({ name: "Draft Group" }),
        currentHandle: "alice",
      })
    );
    expect(submitArgs).not.toHaveProperty("previousGroup");
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(auth.requestAuth).toHaveBeenCalledTimes(1);
    expect(mutateAsync.mock.calls[0][0].visibility.scope.group_id).toBe(
      "group-created"
    );
  });

  it("hides remove option for admin type", async () => {
    render(
      <WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.ADMIN} />,
      { wrapper }
    );
    fireEvent.click(screen.getByRole("button", { name: /Group options/i }));
    expect(screen.getByText("Change group")).toBeInTheDocument();
    expect(screen.queryByText("Remove group")).toBeNull();
  });

  it("shows add label when no group is linked", async () => {
    const waveWithoutGroup = {
      ...wave,
      visibility: {
        ...wave.visibility,
        scope: { group: null },
      },
    };

    render(
      <WaveGroupEditButtons
        haveGroup={false}
        wave={waveWithoutGroup}
        type={WaveGroupType.VIEW}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Group options/i }));

    expect(screen.getByText("Add group")).toBeInTheDocument();
    expect(screen.queryByText("Change group")).toBeNull();

    fireEvent.click(screen.getByText("Add group"));
    expect(screen.getByTestId("inline-panel")).toHaveAttribute(
      "data-allow-clear",
      "false"
    );
  });
});
jest.mock("@headlessui/react", () => {
  const close = jest.fn();
  return {
    Menu: ({ children, ...props }: any) => (
      <div {...props}>
        {typeof children === "function"
          ? children({ open: false, close })
          : children}
      </div>
    ),
    MenuButton: React.forwardRef<HTMLButtonElement, any>(
      ({ children, ...props }, ref) => (
        <button ref={ref} {...props}>
          {children}
        </button>
      )
    ),
    MenuItems: ({ children, anchor: _anchor, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    MenuItem: ({ children }: any) => children({ close, active: false }),
    Transition: ({ children }: any) => (
      <>{typeof children === "function" ? children() : children}</>
    ),
  };
});
