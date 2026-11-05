import ProfilePreferencesSettings from "@/components/header/ProfilePreferencesSettings";
import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ReactQueryWrapperContextType } from "@/components/react-query-wrapper/ReactQueryWrapperContext";
import {
  ApiProfilePreferencesDirectMessagePolicyEnum as DirectMessagePolicy,
  ApiProfilePreferencesNotificationLevelEnum as NotificationLevel,
} from "@/generated/models/ApiProfilePreferences";
import { commonApiFetch, commonApiPut } from "@/services/api/common-api";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPut: jest.fn(),
}));
jest.mock("@/components/groups/assignment/GroupAssignmentDialog", () => ({
  __esModule: true,
  default: ({
    onChange,
    onClose,
  }: {
    readonly onChange: (group: unknown) => unknown;
    readonly onClose: () => void;
  }) => (
    <div role="dialog" aria-label="Who can message you">
      <button
        type="button"
        onClick={() =>
          onChange({ id: "group-2", name: "Meme holders", group: {} })
        }
      >
        Pick Meme holders
      </button>
      <button type="button" onClick={onClose}>
        Close picker
      </button>
    </div>
  ),
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

const groups: Record<string, unknown> = {
  "group-1": { id: "group-1", name: "Level 20+", group: {} },
  "group-2": { id: "group-2", name: "Meme holders", group: {} },
};

function mockFetch(saved: typeof preferences) {
  (commonApiFetch as jest.Mock).mockImplementation(
    ({ endpoint }: { readonly endpoint: string }) => {
      if (endpoint === "profile-preferences") {
        return Promise.resolve(saved);
      }
      const groupId = decodeURIComponent(endpoint.replace("groups/", ""));
      const group = groups[groupId];
      return group
        ? Promise.resolve(group)
        : Promise.reject(new Error("Group not found"));
    }
  );
}

describe("ProfilePreferencesSettings", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { id: "profile-1" },
      setToast: jest.fn(),
    });
    mockFetch(preferences);
    (commonApiPut as jest.Mock).mockImplementation(({ body }) =>
      Promise.resolve(body)
    );
  });

  afterEach(() => jest.clearAllMocks());

  it("explains that DM policy only applies to new conversations", async () => {
    render(<ProfilePreferencesSettings />);

    expect(
      await screen.findByText(
        /existing direct messages and group messages stay available/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /essential security and account notifications, plus the optional categories selected below/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^Security and account notifications only\.$/i)
    ).toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "profile-preferences",
    });
    expect(
      screen.getByRole("region", { name: "Notifications & messages" })
    ).toBeInTheDocument();
    const sectionHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(
      sectionHeadings.map(({ textContent }) => textContent?.trim())
    ).toEqual(["Notifications", "Who can start a direct message with me?"]);
    sectionHeadings.forEach((heading) => expect(heading).toHaveClass("tw-m-0"));
    const notificationsSection = screen.getByRole("region", {
      name: "Notifications",
    });
    expect(notificationsSection).toHaveClass("tw-pt-6", "sm:tw-pt-8");
    expect(notificationsSection.nextElementSibling).toHaveClass(
      "tw-my-10",
      "tw-h-px",
      "tw-bg-iron-800"
    );
    expect(
      screen.getByRole("region", {
        name: "Who can start a direct message with me?",
      })
    ).toHaveClass("tw-pb-8", "sm:tw-pb-10");
    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton.parentElement).toHaveClass(
      "tw-py-6",
      "tw-mx-4",
      "lg:tw-mx-8"
    );
    expect(saveButton).toHaveClass("tw-bg-primary-500", "tw-px-3.5");
    expect(saveButton).not.toHaveClass(
      "tw-w-full",
      "sm:tw-w-auto",
      "sm:tw-px-6",
      "sm:tw-min-w-40"
    );
  });

  it("keeps native controls and full-row labels for each option", async () => {
    render(<ProfilePreferencesSettings />);

    await screen.findByText("Subscription coverage");

    const notificationGroup = screen.getByRole("group", {
      name: "Notifications",
    });
    const directMessageGroup = screen.getByRole("group", {
      name: "Who can start a direct message with me?",
    });
    const radios = [
      ...within(notificationGroup).getAllByRole("radio"),
      ...within(directMessageGroup).getAllByRole("radio"),
    ];
    const categoryCheckboxes = screen.getAllByRole("checkbox");

    // 2 notification levels + 4 DM policies (GROUP_MEMBERS added).
    expect(radios).toHaveLength(6);
    radios.forEach((radio) => {
      expect(radio).toHaveClass("tw-peer", "tw-sr-only");
      expect(radio.nextElementSibling).toHaveClass("tw-min-h-12", "tw-w-full");
    });

    expect(categoryCheckboxes).toHaveLength(6);
    categoryCheckboxes.forEach((checkbox) => {
      expect(checkbox).toHaveClass("tw-peer", "tw-sr-only");
      expect(checkbox.closest("label")).toHaveClass("tw-min-h-12", "tw-w-full");
      expect(checkbox.nextElementSibling).toHaveClass(
        "tw-border-emerald-400/60",
        "tw-bg-emerald-500"
      );
    });
    expect(document.querySelector(".react-toggle")).not.toBeInTheDocument();
  });

  it("hides optional categories while preserving their saved values", async () => {
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);
    await screen.findByText("Subscription coverage");

    await user.click(screen.getByRole("radio", { name: /^Essential\b/i }));

    await waitFor(() => {
      expect(
        screen.queryByText("Subscription coverage")
      ).not.toBeInTheDocument();
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    });
    await user.click(screen.getByRole("radio", { name: /^All/i }));
    await screen.findByText("Subscription coverage");
    expect(screen.getAllByRole("checkbox")).toHaveLength(6);
    expect(screen.getAllByRole("checkbox")[5]).toBeChecked();
  });

  it("saves DM and notification preference changes together", async () => {
    const user = userEvent.setup();
    const invalidateNotifications = jest.fn();
    render(
      <ReactQueryWrapperContext.Provider
        value={
          { invalidateNotifications } as unknown as ReactQueryWrapperContextType
        }
      >
        <ProfilePreferencesSettings />
      </ReactQueryWrapperContext.Provider>
    );
    await screen.findByText("Subscription coverage");

    await user.click(screen.getByRole("radio", { name: /People I follow/i }));
    await user.click(screen.getAllByRole("checkbox")[5]!);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profile-preferences",
        body: expect.objectContaining({
          direct_message_policy: DirectMessagePolicy.PeopleIFollow,
          notifications: expect.objectContaining({
            subscription_coverage: false,
          }),
        }),
      });
      expect(invalidateNotifications).toHaveBeenCalledTimes(1);
    });
  });

  it("requires a group before saving the group policy and sends it", async () => {
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);
    await screen.findByText("Subscription coverage");

    await user.click(
      screen.getByRole("radio", { name: "Members of a group I choose" })
    );

    expect(screen.getByText("No group chosen")).toBeInTheDocument();
    expect(
      screen.getByText("Choose a group to save this option.")
    ).toBeInTheDocument();
    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAccessibleDescription(
      "Choose a group to save this option."
    );
    const followToggle = screen.getByRole("checkbox", {
      name: /People I follow can always message me/i,
    });
    expect(followToggle).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Choose group" }));
    await user.click(screen.getByRole("button", { name: "Pick Meme holders" }));

    expect(
      await screen.findByRole("link", { name: "View members of Meme holders" })
    ).toHaveAttribute("href", "/network?page=1&group=group-2");
    expect(
      screen.queryByRole("dialog", { name: "Who can message you" })
    ).not.toBeInTheDocument();

    await user.click(followToggle);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profile-preferences",
        body: expect.objectContaining({
          direct_message_policy: DirectMessagePolicy.GroupMembers,
          direct_message_group_id: "group-2",
          direct_message_allow_people_i_follow: false,
        }),
      })
    );
  });

  it("warns when the saved group is gone and admission falls back", async () => {
    mockFetch({
      ...preferences,
      direct_message_policy: DirectMessagePolicy.GroupMembers,
      direct_message_group_id: "deleted-group",
      direct_message_group_unavailable: true,
    });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /until you choose another group, only people you follow can start a new conversation/i
    );
    expect(screen.getByText("Group no longer available")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Change group" }));
    await user.click(screen.getByRole("button", { name: "Pick Meme holders" }));

    await waitFor(() =>
      expect(
        screen.queryByText(/until you choose another group/i)
      ).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });

  it("shows the saved group and leaves it saved when switching policies", async () => {
    mockFetch({
      ...preferences,
      direct_message_policy: DirectMessagePolicy.GroupMembers,
      direct_message_group_id: "group-1",
    });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);

    expect(
      await screen.findByRole("link", { name: "View members of Level 20+" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /^Nobody/i }));
    expect(
      screen.queryByRole("button", { name: "Change group" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(commonApiPut).toHaveBeenCalledTimes(1));
    const [{ body }] = (commonApiPut as jest.Mock).mock.calls[0];
    expect(body.direct_message_policy).toBe(DirectMessagePolicy.Nobody);
    // The saved group is neither re-sent nor cleared, so switching back to the
    // group option restores it.
    expect(body).not.toHaveProperty("direct_message_group_id");
  });

  it("saves the group this form shows, even if another session changed it", async () => {
    // The form loaded group-1; another session may since have saved another
    // group. Saving any change keeps what this form shows.
    mockFetch({
      ...preferences,
      direct_message_policy: DirectMessagePolicy.GroupMembers,
      direct_message_group_id: "group-1",
    });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);
    await screen.findByRole("link", { name: "View members of Level 20+" });

    await user.click(
      screen.getByRole("checkbox", {
        name: /People I follow can always message me/i,
      })
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profile-preferences",
        body: expect.objectContaining({
          direct_message_policy: DirectMessagePolicy.GroupMembers,
          direct_message_group_id: "group-1",
          direct_message_allow_people_i_follow: false,
        }),
      })
    );
  });

  it("sends the saved group when the save turns the group policy on", async () => {
    mockFetch({ ...preferences, direct_message_group_id: "group-1" });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);
    await screen.findByText("Subscription coverage");

    await user.click(
      screen.getByRole("radio", { name: "Members of a group I choose" })
    );
    await screen.findByRole("link", { name: "View members of Level 20+" });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profile-preferences",
        body: expect.objectContaining({
          direct_message_policy: DirectMessagePolicy.GroupMembers,
          direct_message_group_id: "group-1",
        }),
      })
    );
  });

  it("does not resend an untouched saved group the API reports as unavailable", async () => {
    mockFetch({
      ...preferences,
      direct_message_policy: DirectMessagePolicy.GroupMembers,
      direct_message_group_id: "deleted-group",
      direct_message_group_unavailable: true,
    });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);
    await screen.findByRole("alert");

    await user.click(
      screen.getByRole("checkbox", {
        name: /People I follow can always message me/i,
      })
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(commonApiPut).toHaveBeenCalledTimes(1));
    const [{ body }] = (commonApiPut as jest.Mock).mock.calls[0];
    expect(body).toEqual(
      expect.objectContaining({
        direct_message_policy: DirectMessagePolicy.GroupMembers,
        direct_message_allow_people_i_follow: false,
      })
    );
    expect(body).not.toHaveProperty("direct_message_group_id");
  });

  it("treats a failed group lookup as retryable, not as a deleted group", async () => {
    mockFetch({
      ...preferences,
      direct_message_policy: DirectMessagePolicy.GroupMembers,
      direct_message_group_id: "flaky-group",
    });
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);

    expect(
      await screen.findByText("Couldn’t load the group details.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/until you choose another group/i)
    ).not.toBeInTheDocument();

    groups["flaky-group"] = {
      id: "flaky-group",
      name: "Back online",
      group: {},
    };
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("link", { name: "View members of Back online" })
    ).toBeInTheDocument();
    delete groups["flaky-group"];
  });

  it("does not send a group for the existing policies", async () => {
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);
    await screen.findByText("Subscription coverage");

    await user.click(screen.getByRole("radio", { name: /^Nobody/i }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(commonApiPut).toHaveBeenCalledTimes(1));
    const [{ body }] = (commonApiPut as jest.Mock).mock.calls[0];
    expect(body.direct_message_policy).toBe(DirectMessagePolicy.Nobody);
    expect(body).not.toHaveProperty("direct_message_group_id");
    expect(body).not.toHaveProperty("direct_message_allow_people_i_follow");
    expect(
      screen.getByText(/profiles you block can never start a new conversation/i)
    ).toBeInTheDocument();
  });

  it("keeps the policy radios one keyboard group around the group controls", async () => {
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings />);
    await screen.findByText("Subscription coverage");

    const groupRadio = screen.getByRole("radio", {
      name: "Members of a group I choose",
    });
    await user.click(groupRadio);
    // Opening the group panel must not remount the radio (that drops focus).
    expect(groupRadio).toBeInTheDocument();
    groupRadio.focus();

    // Tab leaves the radio group for the group controls in reading order.
    await user.tab();
    expect(screen.getByRole("button", { name: "Choose group" })).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("checkbox", {
        name: /People I follow can always message me/i,
      })
    ).toHaveFocus();

    // Arrow keys still move between the policy radios, past the controls.
    groupRadio.focus();
    await user.keyboard("{ArrowDown}");
    const nobodyRadio = screen.getByRole("radio", { name: /^Nobody/i });
    expect(nobodyRadio).toBeChecked();
    expect(nobodyRadio).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "Choose group" })
    ).not.toBeInTheDocument();
  });
});
