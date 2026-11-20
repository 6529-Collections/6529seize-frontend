import ProfilePreferencesSettings from "@/components/header/ProfilePreferencesSettings";
import { useAuth } from "@/components/auth/Auth";
import {
  createEmptyInlineGroupPayload,
  createInitialInlineGroupBuilderState,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import {
  ApiProfilePreferencesDirectMessagePolicyEnum as DirectMessagePolicy,
  ApiProfilePreferencesNotificationLevelEnum as NotificationLevel,
} from "@/generated/models/ApiProfilePreferences";
import { commonApiFetch, commonApiPut } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPut: jest.fn(),
}));
const mockSubmit = jest.fn();
jest.mock("@/hooks/groups/useGroupMutations", () => ({
  useGroupMutations: () => ({ submit: mockSubmit }),
}));
jest.mock("@/components/groups/assignment/GroupAssignmentDialog", () => ({
  __esModule: true,
  default: ({
    criteriaDraft,
    selectedGroup,
    contentError,
    onRetry,
    onClose,
  }: React.ComponentProps<
    typeof import("@/components/groups/assignment/GroupAssignmentDialog").default
  >) => {
    const { createInitialInlineGroupBuilderState: makeDraft } =
      jest.requireActual<
        typeof import("@/components/waves/create-wave/groups/createWaveInlineGroupBuilder")
      >("@/components/waves/create-wave/groups/createWaveInlineGroupBuilder");
    const initial = criteriaDraft?.initial ?? makeDraft();
    return (
      <div role="dialog" aria-label="Who can message you">
        {contentError ? (
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        ) : (
          <>
            {selectedGroup && (
              <p>Saved minimum {selectedGroup.group.level.min}</p>
            )}
            <p>Draft minimum {initial.draft.group.level.min}</p>
            <button
              type="button"
              onClick={() =>
                criteriaDraft?.onApply({
                  ...initial,
                  draft: {
                    ...initial.draft,
                    group: {
                      ...initial.draft.group,
                      level: { min: 25, max: null },
                    },
                  },
                })
              }
            >
              Done
            </button>
          </>
        )}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  },
}));

const preferences = {
  direct_message_policy: DirectMessagePolicy.Everyone,
  direct_message_group_id: null as string | null,
  direct_message_allow_people_i_follow: true,
  direct_message_group_unavailable: false,
  notification_level: NotificationLevel.All,
  notifications: {
    direct_messages: true,
    mentions_replies_quotes: true,
    reactions_votes_boosts: true,
    new_followers: true,
    rep_and_nic: true,
    subscription_coverage: true,
  },
};

const existingGroup = {
  id: "group-1",
  name: "Wave access",
  is_private: false,
  group: {
    ...createEmptyInlineGroupPayload().group,
    identity_group_id: null,
    excluded_identity_group_id: null,
    level: { min: 15, max: null },
  },
};

function seedPreferences(overrides: Partial<typeof preferences> = {}) {
  const saved = { ...preferences, ...overrides };
  jest.mocked(commonApiFetch).mockImplementation(async ({ endpoint }) => {
    if (endpoint === "profile-preferences") return { ...saved };
    if (endpoint === "groups/group-1") return existingGroup;
    throw new Error("Group could not be loaded");
  });
  jest.mocked(commonApiPut).mockImplementation(async ({ body }) => {
    const fields = body as Partial<typeof preferences>;
    const notifications = { ...saved.notifications, ...fields.notifications };
    Object.assign(saved, fields, { notifications });
    return { ...saved };
  });
}

const saveButton = () => screen.getByRole("button", { name: "Save" });

describe("ProfilePreferencesSettings", () => {
  beforeEach(() => {
    jest.mocked(useAuth).mockReturnValue({
      connectedProfile: { id: "profile-1", handle: "alice" },
      setToast: jest.fn(),
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as ReturnType<typeof useAuth>);
    seedPreferences();
    mockSubmit.mockResolvedValue({ ok: true, group: { id: "group-2" } });
  });

  afterEach(() => jest.clearAllMocks());

  it("keeps the preferences options as native controls with full-row labels", async () => {
    const view = render(
      <ProfilePreferencesSettings activeTab="notifications" />
    );
    const categoryCheckboxes = await screen.findAllByRole("checkbox");
    const notificationRadios = screen.getAllByRole("radio");
    expect(categoryCheckboxes).toHaveLength(6);
    expect(notificationRadios).toHaveLength(2);
    categoryCheckboxes.forEach((checkbox) => {
      expect(checkbox).toHaveClass("tw-peer", "tw-sr-only");
      expect(checkbox.closest("label")).toHaveClass("tw-min-h-12", "tw-w-full");
      expect(checkbox.nextElementSibling).toHaveClass(
        "tw-border-emerald-400/60",
        "tw-bg-emerald-500"
      );
    });
    view.rerender(<ProfilePreferencesSettings activeTab="messages" />);
    const messageRadios = screen.getAllByRole("radio");
    expect(messageRadios).toHaveLength(4);
    [...notificationRadios, ...messageRadios].forEach((radio) => {
      expect(radio).toHaveClass("tw-peer", "tw-sr-only");
      expect(radio.nextElementSibling).toHaveClass("tw-min-h-12", "tw-w-full");
    });
  });

  it("keeps DM policy choices together in the keyboard order", async () => {
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings activeTab="messages" />);
    const criteria = await screen.findByRole("radio", {
      name: "People who meet my criteria",
    });
    await user.click(criteria);
    criteria.focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Set criteria" })).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("checkbox", {
        name: /People I follow can always message me/,
      })
    ).toHaveFocus();
    criteria.focus();
    await user.keyboard("{ArrowDown}");
    const nobody = screen.getByRole("radio", { name: "Nobody" });
    expect(nobody).toBeChecked();
    expect(nobody).toHaveFocus();
  });

  it.each(["notifications", "messages"] as const)(
    "saves the tabs independently with %s saved first",
    async (firstTab) => {
      const user = userEvent.setup();
      const view = render(
        <ProfilePreferencesSettings activeTab="notifications" />
      );
      const notificationsToggle = await screen.findByRole("checkbox", {
        name: "New followers",
      });
      await user.click(notificationsToggle);
      expect(screen.queryByRole("radio", { name: "Nobody" })).toBeNull();
      view.rerender(<ProfilePreferencesSettings activeTab="messages" />);
      expect(
        screen.queryByRole("checkbox", { name: "New followers" })
      ).toBeNull();
      expect(screen.getByText(/add you to an encrypted group/i)).toBeVisible();
      await user.click(screen.getByRole("radio", { name: "Nobody" }));

      const bodies = {
        notifications: { notifications: { new_followers: false } },
        messages: { direct_message_policy: "NOBODY" },
      };
      const secondTab = firstTab === "messages" ? "notifications" : "messages";
      for (const [index, tab] of [firstTab, secondTab].entries()) {
        view.rerender(<ProfilePreferencesSettings activeTab={tab} />);
        await user.click(saveButton());
        await waitFor(() =>
          expect(commonApiPut).toHaveBeenNthCalledWith(index + 1, {
            endpoint: "profile-preferences",
            body: bodies[tab],
          })
        );
      }
      view.rerender(<ProfilePreferencesSettings activeTab="notifications" />);
      expect(
        screen.getByRole("checkbox", { name: "New followers" })
      ).not.toBeChecked();
      view.rerender(<ProfilePreferencesSettings activeTab="messages" />);
      expect(screen.getByRole("radio", { name: "Nobody" })).toBeChecked();
    }
  );

  it("saves the notification level on its own and keeps category choices", async () => {
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings activeTab="notifications" />);
    await user.click(await screen.findByRole("radio", { name: "Essential" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("checkbox", { name: "New followers" })
      ).toBeNull()
    );
    await user.click(saveButton());
    await waitFor(() =>
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profile-preferences",
        body: { notification_level: "ESSENTIAL_ONLY" },
      })
    );
    await user.click(screen.getByRole("radio", { name: "All" }));
    expect(
      screen.getByRole("checkbox", { name: "New followers" })
    ).toBeChecked();
  });

  it("requires criteria and saves them only from Messages Save", async () => {
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings activeTab="messages" />);
    await user.click(
      await screen.findByRole("radio", { name: "People who meet my criteria" })
    );
    expect(saveButton()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Set criteria" }));
    await user.click(await screen.findByRole("button", { name: "Done" }));
    expect(commonApiPut).not.toHaveBeenCalled();
    expect(mockSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Edit criteria" }));
    expect(await screen.findByText("Draft minimum 25")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: /People I follow can always message me/,
      })
    );
    await user.click(saveButton());
    await waitFor(() =>
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profile-preferences",
        body: {
          direct_message_policy: "GROUP_MEMBERS",
          direct_message_group_id: "group-2",
          direct_message_allow_people_i_follow: false,
        },
      })
    );
    expect(mockSubmit).toHaveBeenCalledWith({
      currentHandle: "alice",
      publish: true,
      payload: {
        ...createInitialInlineGroupBuilderState().draft,
        name: "Can message me",
        group: {
          ...createEmptyInlineGroupPayload().group,
          level: { min: 25, max: null },
        },
        is_private: true,
      },
    });
  });

  it("starts from existing criteria and saves edits as a separate private group", async () => {
    seedPreferences({
      direct_message_policy: DirectMessagePolicy.GroupMembers,
      direct_message_group_id: "group-1",
    });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings activeTab="messages" />);
    await user.click(
      await screen.findByRole("button", { name: "Edit criteria" })
    );
    expect(await screen.findByText("Saved minimum 15")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(saveButton());
    await waitFor(() =>
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profile-preferences",
        body: { direct_message_group_id: "group-2" },
      })
    );
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ is_private: true }),
      })
    );
  });

  it("reuses the created criteria if saving the preference fails and is retried", async () => {
    const user = userEvent.setup();
    jest
      .mocked(commonApiPut)
      .mockRejectedValueOnce(new Error("Could not save"));
    render(<ProfilePreferencesSettings activeTab="messages" />);
    await user.click(
      await screen.findByRole("radio", { name: "People who meet my criteria" })
    );
    await user.click(screen.getByRole("button", { name: "Set criteria" }));
    await user.click(await screen.findByRole("button", { name: "Done" }));
    await user.click(saveButton());
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await user.click(saveButton());
    await waitFor(() => expect(commonApiPut).toHaveBeenCalledTimes(2));
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("can switch to Everyone without resending the old group or notification settings", async () => {
    seedPreferences({
      direct_message_policy: DirectMessagePolicy.GroupMembers,
      direct_message_group_id: "group-1",
      direct_message_group_unavailable: true,
    });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings activeTab="messages" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /saved criteria are unavailable/i
    );
    await user.click(screen.getByRole("radio", { name: "Everyone" }));
    await user.click(saveButton());
    await waitFor(() =>
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profile-preferences",
        body: { direct_message_policy: "EVERYONE" },
      })
    );
  });

  it("can retry loading the saved criteria without treating a fetch failure as deletion", async () => {
    seedPreferences({
      direct_message_policy: DirectMessagePolicy.GroupMembers,
      direct_message_group_id: "group-1",
    });
    const fetch = jest.mocked(commonApiFetch).getMockImplementation()!;
    jest.mocked(commonApiFetch).mockImplementation(async (request) => {
      if (request.endpoint === "groups/group-1")
        throw new Error("Transient failure");
      return fetch(request);
    });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings activeTab="messages" />);
    await user.click(
      await screen.findByRole("button", { name: "Edit criteria" })
    );
    const retry = await screen.findByRole("button", { name: "Try again" });
    jest.mocked(commonApiFetch).mockImplementation(fetch);
    await user.click(retry);
    expect(await screen.findByText("Saved minimum 15")).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
