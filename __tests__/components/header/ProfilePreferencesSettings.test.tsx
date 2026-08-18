import ProfilePreferencesSettings from "@/components/header/ProfilePreferencesSettings";
import { useAuth } from "@/components/auth/Auth";
import {
  ReactQueryWrapperContext,
  type ReactQueryWrapperContextType,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  ApiProfilePreferencesDirectMessagePolicyEnum as DirectMessagePolicy,
  ApiProfilePreferencesNotificationLevelEnum as NotificationLevel,
} from "@/generated/models/ApiProfilePreferences";
import { commonApiFetch, commonApiPut } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPut: jest.fn(),
}));
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    ({ title, children }: { title: string; children: ReactNode }) => (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    )
);

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
    (useAuth as jest.Mock).mockReturnValue({ setToast: jest.fn() });
    (commonApiFetch as jest.Mock).mockResolvedValue(preferences);
    (commonApiPut as jest.Mock).mockImplementation(({ body }) =>
      Promise.resolve(body)
    );
  });

  afterEach(() => jest.clearAllMocks());

  it("explains that DM policy only applies to new conversations", async () => {
    render(<ProfilePreferencesSettings isOpen onClose={jest.fn()} />);

    expect(
      await screen.findByText(
        /existing direct messages and group messages stay available/i
      )
    ).toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "profiles/preferences",
    });
  });

  it("shows optional categories as paused while preserving their saved values", async () => {
    const user = userEvent.setup();
    render(<ProfilePreferencesSettings isOpen onClose={jest.fn()} />);
    await screen.findByText("Subscription coverage");

    await user.click(screen.getByLabelText("Essential only"));

    expect(screen.getAllByText("Paused")).toHaveLength(6);
    expect(
      screen.getByText("Subscription coverage").closest("label")
    ).toBeNull();
    expect(
      screen.getByText(/choices are saved and restored/i)
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("All"));
    expect(screen.getAllByRole("checkbox")).toHaveLength(6);
    expect(screen.getAllByRole("checkbox")[5]).toBeChecked();
  });

  it("saves DM and notification preference changes together", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const invalidateNotifications = jest.fn();
    render(
      <ReactQueryWrapperContext.Provider
        value={
          { invalidateNotifications } as unknown as ReactQueryWrapperContextType
        }
      >
        <ProfilePreferencesSettings isOpen onClose={onClose} />
      </ReactQueryWrapperContext.Provider>
    );
    await screen.findByText("Subscription coverage");

    await user.click(screen.getByRole("radio", { name: /People I follow/i }));
    await user.click(screen.getAllByRole("checkbox")[5]!);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(commonApiPut).toHaveBeenCalledWith({
        endpoint: "profiles/preferences",
        body: expect.objectContaining({
          direct_message_policy: DirectMessagePolicy.PeopleIFollow,
          notifications: expect.objectContaining({
            subscription_coverage: false,
          }),
        }),
      });
      expect(invalidateNotifications).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
