import ProfilePreferencesSettings from "@/components/header/ProfilePreferencesSettings";
import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ReactQueryWrapperContextType } from "@/components/react-query-wrapper/ReactQueryWrapperContext";
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
const preferences = {
  direct_message_policy: DirectMessagePolicy.Everyone,
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

describe("ProfilePreferencesSettings", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { id: "profile-1" },
      setToast: jest.fn(),
    });
    (commonApiFetch as jest.Mock).mockResolvedValue(preferences);
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
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map(({ textContent }) => textContent?.trim())
    ).toEqual(["Notifications", "Who can start a direct message with me?"]);
    expect(screen.getByRole("region", { name: "Notifications" })).toHaveClass(
      "tw-pb-0",
      "tw-pt-6"
    );
    expect(
      screen.getByRole("region", {
        name: "Who can start a direct message with me?",
      })
    ).toHaveClass("tw-pb-0", "tw-pt-6");
    expect(
      screen.getByRole("button", { name: "Save Changes" }).parentElement
    ).toHaveClass("tw-pt-6");
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
});
