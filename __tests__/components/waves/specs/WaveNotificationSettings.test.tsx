import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveNotificationSettings from "@/components/waves/specs/WaveNotificationSettings";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

jest.mock("@/hooks/useWaveNotificationSubscription", () => ({
  useWaveNotificationSubscription: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    seizeSettings: {
      all_drops_notifications_subscribers_limit: 1000,
    },
  }),
}));

const mockWave: ApiWave = {
  id: "wave-123",
  name: "Test Wave",
  metrics: {
    subscribers_count: 50,
    muted: false,
  },
  subscribed_actions: ["follow"],
} as any;

const mockWaveHighSubscribers: ApiWave = {
  id: "wave-456",
  name: "Popular Wave",
  metrics: {
    subscribers_count: 1500,
    muted: false,
  },
  subscribed_actions: ["follow"],
} as any;

const mockWaveMuted: ApiWave = {
  id: "wave-muted",
  name: "Muted Wave",
  metrics: {
    subscribers_count: 50,
    muted: true,
  },
  subscribed_actions: ["follow"],
} as any;

const mockAuthContext = {
  setToast: jest.fn(),
};

const mockUseWaveNotificationSubscription =
  require("@/hooks/useWaveNotificationSubscription").useWaveNotificationSubscription;

const mockMatchMedia = () => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  globalThis.matchMedia = window.matchMedia;
};

describe("WaveNotificationSettings", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockMatchMedia();
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false, enabled_group_notifications: [] },
      refetch: jest.fn(),
    });
  });

  const renderComponent = (wave = mockWave) => {
    return render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <WaveNotificationSettings wave={wave} />
      </AuthContext.Provider>
    );
  };

  const openNotificationMenu = async () => {
    const trigger = screen.getByLabelText("Open notification settings");
    await userEvent.click(trigger);
    return trigger;
  };

  it("renders mute without notification menu when not following wave", () => {
    const waveNotFollowing = { ...mockWave, subscribed_actions: [] };
    renderComponent(waveNotFollowing);

    expect(screen.getByLabelText("Mute wave")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Open notification settings")
    ).not.toBeInTheDocument();
  });

  it("renders a notification menu and mute button when following wave", async () => {
    renderComponent();

    const trigger = screen.getByLabelText("Open notification settings");
    const muteButton = screen.getByLabelText("Mute wave");

    expect(trigger).toBeInTheDocument();
    expect(muteButton).toBeInTheDocument();
    expect(trigger).toHaveClass("tw-cursor-pointer");
    expect(muteButton).toHaveClass("tw-cursor-pointer");
    expect(trigger.parentElement?.parentElement).toHaveClass(
      "tw-grid",
      "tw-grid-cols-2",
      "tw-gap-x-1.5"
    );
    expect(muteButton.parentElement?.parentElement).toBe(
      trigger.parentElement?.parentElement
    );
    expect(trigger).toHaveClass("tw-w-full", "tw-border");
    expect(muteButton).toHaveClass("tw-w-full", "tw-border");
    expect(
      screen.queryByLabelText("Receive ALL mention notifications")
    ).not.toBeInTheDocument();

    await openNotificationMenu();

    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("aria-labelledby", trigger.id);
    expect(menu.querySelector("ul")).toHaveClass("tw-m-0");

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    expect(allMentionsButton).toBeInTheDocument();
    expect(allButton).toBeInTheDocument();
    expect(allMentionsButton).toHaveAttribute("role", "menuitemcheckbox");
    expect(allButton).toHaveAttribute("role", "menuitemcheckbox");
    expect(allMentionsButton).toHaveClass("tw-cursor-pointer");
    expect(allButton).toHaveClass("tw-cursor-pointer");
    expect(allMentionsButton).not.toHaveAttribute("data-tooltip-content");
    expect(allButton).not.toHaveAttribute("data-tooltip-content");
    expect(allMentionsButton.parentElement).toHaveAttribute("role", "none");
    expect(allButton.parentElement).toHaveAttribute("role", "none");
    expect(screen.getByText("ALL mentions")).toBeInTheDocument();
    expect(screen.queryByText("@ALL")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Receive mentions-only notifications")
    ).not.toBeInTheDocument();
  });

  it("shows ALL mention menu item as active when enabled", async () => {
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: {
        subscribed: false,
        enabled_group_notifications: [ApiDropGroupMention.All],
      },
      refetch: jest.fn(),
    });

    renderComponent();

    expect(screen.getByLabelText("Open notification settings")).toHaveClass(
      "tw-bg-primary-400/10",
      "tw-border-primary-400/30",
      "tw-text-primary-400"
    );

    await openNotificationMenu();

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    expect(allMentionsButton).toHaveClass("tw-text-primary-400");
  });

  it("shows all-message menu item as active when all-message notifications enabled", async () => {
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true, enabled_group_notifications: [] },
      refetch: jest.fn(),
    });

    renderComponent();

    expect(screen.getByLabelText("Open notification settings")).toHaveClass(
      "tw-bg-primary-400/10",
      "tw-border-primary-400/30",
      "tw-text-primary-400"
    );

    await openNotificationMenu();

    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    expect(allButton).toHaveClass("tw-text-primary-400");
  });

  it("can show ALL mention and all-message menu items active together", async () => {
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: {
        subscribed: true,
        enabled_group_notifications: [ApiDropGroupMention.All],
      },
      refetch: jest.fn(),
    });

    renderComponent();

    expect(screen.getByLabelText("Open notification settings")).toHaveClass(
      "tw-bg-primary-400/10",
      "tw-border-primary-400/30",
      "tw-text-primary-400"
    );

    await openNotificationMenu();

    expect(
      screen.getByLabelText("Receive ALL mention notifications")
    ).toHaveClass("tw-text-primary-400");
    expect(
      screen.getByLabelText("Receive notifications for all messages")
    ).toHaveClass("tw-text-primary-400");
  });

  it("shows all-message option as unavailable when subscriber limit is reached", async () => {
    renderComponent(mockWaveHighSubscribers);

    expect(screen.getByLabelText("Open notification settings")).toBeEnabled();
    const muteButton = screen.getByLabelText("Mute wave");
    expect(muteButton).not.toBeDisabled();
    expect(muteButton).toHaveAttribute(
      "data-tooltip-content",
      "Click to mute this wave"
    );
    expect(muteButton.parentElement?.parentElement).toHaveClass(
      "tw-grid",
      "tw-grid-cols-2"
    );

    await openNotificationMenu();

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    expect(allMentionsButton).not.toBeDisabled();
    expect(allButton).not.toBeDisabled();
    expect(allButton).toHaveAttribute("aria-disabled", "true");
    expect(allButton).toHaveAccessibleDescription(
      "Below 1,000 followers only."
    );
    expect(screen.getByText("Below 1,000 followers only.")).toBeInTheDocument();
    expect(allButton).toHaveClass("tw-cursor-not-allowed");
    expect(allMentionsButton).toHaveClass("tw-cursor-pointer");
    expect(allMentionsButton).not.toHaveAttribute("data-tooltip-content");
    expect(allButton).not.toHaveAttribute("data-tooltip-content");
  });

  it("keeps unavailable all-message option focusable without firing an update", async () => {
    const { commonApiPost } = require("@/services/api/common-api");

    renderComponent(mockWaveHighSubscribers);

    await openNotificationMenu();

    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    allButton.focus();

    await userEvent.keyboard("{Enter}");

    expect(commonApiPost).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(allButton).toHaveFocus();
  });

  it("allows disabling all-message notifications when subscribed and subscriber limit reached", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const refetch = jest.fn();

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true, enabled_group_notifications: [] },
      refetch,
    });
    commonApiPost.mockResolvedValue({});

    renderComponent(mockWaveHighSubscribers);

    await openNotificationMenu();

    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    expect(allButton).toBeEnabled();
    expect(allButton).toHaveClass("tw-text-primary-400");
    expect(allButton).not.toHaveClass("tw-cursor-not-allowed");
    expect(allButton.parentElement?.tagName).toBe("LI");
    expect(allButton).toHaveAccessibleDescription(
      "Re-enable below 1,000 followers."
    );
    expect(
      screen.getByText("Re-enable below 1,000 followers.")
    ).toBeInTheDocument();

    await userEvent.click(allButton);

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "notifications/wave-subscription/wave-456",
        body: {
          subscribed: false,
          enabled_group_notifications: [],
        },
      });
    });

    expect(refetch).toHaveBeenCalled();
  });

  it("enables ALL mention notifications while preserving all drop preference", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const refetch = jest.fn();

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true, enabled_group_notifications: [] },
      refetch,
    });

    commonApiPost.mockResolvedValue({});

    renderComponent();

    await openNotificationMenu();

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    await userEvent.click(allMentionsButton);

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "notifications/wave-subscription/wave-123",
        body: {
          subscribed: true,
          enabled_group_notifications: [ApiDropGroupMention.All],
        },
      });
    });

    expect(refetch).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.queryByLabelText("Receive ALL mention notifications")
      ).not.toBeInTheDocument();
    });
  });

  it("disables ALL mention notifications", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const refetch = jest.fn();

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: {
        subscribed: false,
        enabled_group_notifications: [ApiDropGroupMention.All],
      },
      refetch,
    });

    commonApiPost.mockResolvedValue({});

    renderComponent();

    await openNotificationMenu();

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    await userEvent.click(allMentionsButton);

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "notifications/wave-subscription/wave-123",
        body: {
          subscribed: false,
          enabled_group_notifications: [],
        },
      });
    });

    expect(refetch).toHaveBeenCalled();
  });

  it("enables all-message notifications while preserving ALL mention preference", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const refetch = jest.fn();

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: {
        subscribed: false,
        enabled_group_notifications: [ApiDropGroupMention.All],
      },
      refetch,
    });

    commonApiPost.mockResolvedValue({});

    renderComponent();

    await openNotificationMenu();

    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    await userEvent.click(allButton);

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "notifications/wave-subscription/wave-123",
        body: {
          subscribed: true,
          enabled_group_notifications: [ApiDropGroupMention.All],
        },
      });
    });

    expect(refetch).toHaveBeenCalled();
  });

  it("disables all-message notifications while preserving ALL mention preference", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const refetch = jest.fn();

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: {
        subscribed: true,
        enabled_group_notifications: [ApiDropGroupMention.All],
      },
      refetch,
    });

    commonApiPost.mockResolvedValue({});

    renderComponent();

    await openNotificationMenu();

    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    await userEvent.click(allButton);

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "notifications/wave-subscription/wave-123",
        body: {
          subscribed: false,
          enabled_group_notifications: [ApiDropGroupMention.All],
        },
      });
    });

    expect(refetch).toHaveBeenCalled();
  });

  it("mutes the wave from the mute button when all-message notifications are unavailable", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    commonApiPost.mockResolvedValue({});

    renderComponent(mockWaveHighSubscribers);

    const muteButton = screen.getByLabelText("Mute wave");
    await userEvent.click(muteButton);

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "waves/wave-456/mute",
        body: {},
      });
    });
  });

  it("mutes the wave from the mute button before joining", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    commonApiPost.mockResolvedValue({});

    renderComponent({ ...mockWave, subscribed_actions: [] });

    const muteButton = screen.getByLabelText("Mute wave");
    await userEvent.click(muteButton);

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "waves/wave-123/mute",
        body: {},
      });
    });
  });

  it("mutes the wave from the mute button when all-message notifications are available", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    commonApiPost.mockResolvedValue({});

    renderComponent();

    expect(
      screen.getByLabelText("Open notification settings")
    ).toBeInTheDocument();

    const muteButton = screen.getByLabelText("Mute wave");
    await userEvent.click(muteButton);

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: "waves/wave-123/mute",
        body: {},
      });
    });
  });

  it("does not update notification preferences before preferences load", async () => {
    const { commonApiPost } = require("@/services/api/common-api");

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: undefined,
      isPending: true,
      refetch: jest.fn(),
    });

    renderComponent();

    const trigger = screen.getByLabelText("Open notification settings");
    expect(trigger).toBeDisabled();
    expect(screen.getByLabelText("Mute wave")).not.toBeDisabled();

    await userEvent.click(trigger);

    expect(
      screen.queryByLabelText("Receive ALL mention notifications")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Receive notifications for all messages")
    ).not.toBeInTheDocument();
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("lets users retry when notification preferences fail to load", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const refetch = jest.fn();

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: undefined,
      isError: true,
      isFetching: false,
      isPending: false,
      refetch,
    });

    renderComponent();

    const retryButton = screen.getByLabelText("Retry notification settings");
    expect(retryButton).toBeEnabled();
    expect(retryButton).toHaveClass("tw-cursor-pointer");
    expect(screen.getByLabelText("Mute wave")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Open notification settings")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Receive ALL mention notifications")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Receive notifications for all messages")
    ).not.toBeInTheDocument();

    await userEvent.click(retryButton);

    expect(refetch).toHaveBeenCalled();
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("handles API error when enabling all-message notifications", async () => {
    const { commonApiPost } = require("@/services/api/common-api");

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false, enabled_group_notifications: [] },
      refetch: jest.fn(),
    });

    commonApiPost.mockRejectedValue("API Error");

    renderComponent();

    await openNotificationMenu();

    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    await userEvent.click(allButton);

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        title: "Couldn't update notification settings.",
        description: "Please try again.",
        details: "API Error.",
        type: "error",
      });
    });
  });

  it("handles API error when disabling ALL mention notifications", async () => {
    const { commonApiPost } = require("@/services/api/common-api");

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: {
        subscribed: false,
        enabled_group_notifications: [ApiDropGroupMention.All],
      },
      refetch: jest.fn(),
    });

    commonApiPost.mockRejectedValue("Unable to update subscription");

    renderComponent();

    await openNotificationMenu();

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    await userEvent.click(allMentionsButton);

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        title: "Couldn't update notification settings.",
        description: "Please try again.",
        details: "Unable to update subscription.",
        type: "error",
      });
    });
  });

  it("shows loading spinner when toggling notifications", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const refetch = jest.fn();

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false, enabled_group_notifications: [] },
      refetch,
    });

    // Make the API call hang to test loading state
    commonApiPost.mockImplementation(() => new Promise(() => {}));

    renderComponent();

    await openNotificationMenu();

    const allButton = screen.getByLabelText(
      "Receive notifications for all messages"
    );
    await userEvent.click(allButton);

    await waitFor(() => {
      expect(
        screen.queryByLabelText("Receive notifications for all messages")
      ).not.toBeInTheDocument();
    });

    const trigger = screen.getByLabelText("Open notification settings");
    await waitFor(() => {
      expect(trigger.querySelector(".spinner")).toBeInTheDocument();
    });
  });

  it("keeps mute button focusable when wave has high subscriber count", () => {
    renderComponent(mockWaveHighSubscribers);

    const muteButton = screen.getByLabelText("Mute wave");
    expect(muteButton).not.toBeDisabled();
  });

  it("renders muted button when wave is muted", () => {
    renderComponent(mockWaveMuted);

    const mutedButton = screen.getByLabelText("Unmute wave");
    expect(mutedButton).toBeInTheDocument();
    expect(mutedButton).toHaveClass("tw-cursor-pointer");
    expect(mutedButton).toHaveClass(
      "tw-bg-error/10",
      "tw-border-error/40",
      "tw-text-error"
    );
    expect(screen.getByText("Muted")).toBeInTheDocument();
  });

  it("does not render notification settings when wave is muted", () => {
    renderComponent(mockWaveMuted);

    expect(
      screen.queryByLabelText("Open notification settings")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Receive ALL mention notifications")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Receive notifications for all messages")
    ).not.toBeInTheDocument();
  });

  it("calls unmute API when clicking muted button", async () => {
    const { commonApiDelete } = require("@/services/api/common-api");
    commonApiDelete.mockResolvedValue({});

    renderComponent(mockWaveMuted);

    const mutedButton = screen.getByLabelText("Unmute wave");
    await userEvent.click(mutedButton);

    await waitFor(() => {
      expect(commonApiDelete).toHaveBeenCalledWith({
        endpoint: "waves/wave-muted/mute",
      });
    });
  });

  it("shows loading spinner when unmuting", async () => {
    const { commonApiDelete } = require("@/services/api/common-api");
    commonApiDelete.mockImplementation(() => new Promise(() => {}));

    renderComponent(mockWaveMuted);

    const mutedButton = screen.getByLabelText("Unmute wave");
    await userEvent.click(mutedButton);

    await waitFor(() => {
      expect(mutedButton.querySelector(".spinner")).toBeInTheDocument();
    });
  });

  it("handles error when unmuting fails", async () => {
    const { commonApiDelete } = require("@/services/api/common-api");
    commonApiDelete.mockRejectedValue("Unable to unmute wave");

    renderComponent(mockWaveMuted);

    const mutedButton = screen.getByLabelText("Unmute wave");
    await userEvent.click(mutedButton);

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        title: "Couldn't unmute this wave.",
        description: "Please try again.",
        details: "Unable to unmute wave.",
        type: "error",
      });
    });
  });
});
