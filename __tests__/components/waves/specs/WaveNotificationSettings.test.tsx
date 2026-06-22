import React from "react";
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

jest.mock("react-bootstrap", () => ({
  OverlayTrigger: ({ children }: any) => children,
  Tooltip: ({ children }: any) => <div>{children}</div>,
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

const expectActivePreferenceButton = (button: HTMLElement) => {
  expect(button).toHaveClass("tw-bg-primary-400/10", "tw-text-primary-400");
};

describe("WaveNotificationSettings", () => {
  beforeEach(() => {
    jest.resetAllMocks();
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

  it("does not render when not following wave", () => {
    const waveNotFollowing = { ...mockWave, subscribed_actions: [] };
    const { container } = renderComponent(waveNotFollowing);

    expect(container.firstChild).toBeNull();
  });

  it("renders notification buttons when following wave", () => {
    renderComponent();

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    const allButton = screen.getByLabelText("Receive all drop notifications");
    expect(allMentionsButton).toBeInTheDocument();
    expect(allButton).toBeInTheDocument();
    expect(allMentionsButton.parentElement).toHaveClass(
      "tw-grid",
      "tw-grid-cols-2",
      "tw-gap-x-1.5"
    );
    expect(allButton.parentElement).toBe(allMentionsButton.parentElement);
    expect(allMentionsButton).toHaveClass("tw-w-full", "tw-border");
    expect(allButton).toHaveClass("tw-w-full", "tw-border");
    expect(
      screen.queryByLabelText("Receive mentions-only notifications")
    ).not.toBeInTheDocument();
  });

  it("shows ALL mention button as active when enabled", () => {
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: {
        subscribed: false,
        enabled_group_notifications: [ApiDropGroupMention.All],
      },
      refetch: jest.fn(),
    });

    renderComponent();

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    expectActivePreferenceButton(allMentionsButton);
  });

  it("shows all drop button as active when all drop notifications enabled", () => {
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true, enabled_group_notifications: [] },
      refetch: jest.fn(),
    });

    renderComponent();

    const allButton = screen.getByLabelText("Receive all drop notifications");
    expectActivePreferenceButton(allButton);
  });

  it("can show ALL mention and all drop buttons active together", () => {
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: {
        subscribed: true,
        enabled_group_notifications: [ApiDropGroupMention.All],
      },
      refetch: jest.fn(),
    });

    renderComponent();

    expectActivePreferenceButton(
      screen.getByLabelText("Receive ALL mention notifications")
    );
    expectActivePreferenceButton(
      screen.getByLabelText("Receive all drop notifications")
    );
  });

  it("marks only all drop notifications unavailable when subscriber limit reached", () => {
    renderComponent(mockWaveHighSubscribers);

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    const allButton = screen.getByLabelText("Receive all drop notifications");
    expect(allMentionsButton).not.toBeDisabled();
    expect(allButton).not.toBeDisabled();
    expect(allButton).toHaveAttribute("aria-disabled", "true");
    expect(allButton).toHaveAccessibleDescription(
      "'All' notifications unavailable for waves with 1,000+ followers."
    );
    expect(allButton).toHaveClass("tw-cursor-not-allowed");
    expect(allButton).not.toHaveAttribute("style");
    expect(allButton.parentElement).toHaveClass("tw-grid");
  });

  it("allows disabling all drop notifications when subscribed and subscriber limit reached", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const refetch = jest.fn();

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true, enabled_group_notifications: [] },
      refetch,
    });
    commonApiPost.mockResolvedValue({});

    renderComponent(mockWaveHighSubscribers);

    const allButton = screen.getByLabelText("Receive all drop notifications");
    expect(allButton).toBeEnabled();
    expectActivePreferenceButton(allButton);
    expect(allButton).not.toHaveClass("tw-cursor-not-allowed");
    expect(allButton).not.toHaveAttribute("style");
    expect(allButton.parentElement?.tagName).toBe("DIV");

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

  it("enables all drop notifications while preserving ALL mention preference", async () => {
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

    const allButton = screen.getByLabelText("Receive all drop notifications");
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

  it("disables all drop notifications while preserving ALL mention preference", async () => {
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

    const allButton = screen.getByLabelText("Receive all drop notifications");
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

  it("does not call API when clicking disabled all drop notifications", async () => {
    const { commonApiPost } = require("@/services/api/common-api");

    renderComponent(mockWaveHighSubscribers);

    const allButton = screen.getByLabelText("Receive all drop notifications");
    await userEvent.click(allButton);

    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("does not update notification preferences before preferences load", async () => {
    const { commonApiPost } = require("@/services/api/common-api");

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: undefined,
      isPending: true,
      refetch: jest.fn(),
    });

    renderComponent();

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    const allButton = screen.getByLabelText("Receive all drop notifications");
    expect(allMentionsButton).toBeDisabled();
    expect(allButton).toBeDisabled();

    await userEvent.click(allMentionsButton);
    await userEvent.click(allButton);

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
    expect(
      screen.queryByLabelText("Receive ALL mention notifications")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Receive all drop notifications")
    ).not.toBeInTheDocument();

    await userEvent.click(retryButton);

    expect(refetch).toHaveBeenCalled();
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("handles API error when enabling all drop notifications", async () => {
    const { commonApiPost } = require("@/services/api/common-api");

    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false, enabled_group_notifications: [] },
      refetch: jest.fn(),
    });

    commonApiPost.mockRejectedValue("API Error");

    renderComponent();

    const allButton = screen.getByLabelText("Receive all drop notifications");
    await userEvent.click(allButton);

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.stringMatching(/API Error/i),
          title: expect.stringMatching(/notification settings/i),
          type: "error",
        })
      );
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

    const allMentionsButton = screen.getByLabelText(
      "Receive ALL mention notifications"
    );
    await userEvent.click(allMentionsButton);

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.stringMatching(/Unable to update subscription/i),
          title: expect.stringMatching(/notification settings/i),
          type: "error",
        })
      );
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

    const allButton = screen.getByLabelText("Receive all drop notifications");
    await userEvent.click(allButton);

    // Check for spinner in the button
    await waitFor(() => {
      expect(allButton.querySelector(".spinner")).toBeInTheDocument();
    });
  });

  it("keeps all button focusable when wave has high subscriber count", () => {
    renderComponent(mockWaveHighSubscribers);

    const allButton = screen.getByLabelText("Receive all drop notifications");
    expect(allButton).not.toBeDisabled();
    expect(allButton).toHaveAttribute("aria-disabled", "true");
  });

  it("renders muted button when wave is muted", () => {
    renderComponent(mockWaveMuted);

    const mutedButton = screen.getByLabelText("Unmute wave");
    expect(mutedButton).toBeInTheDocument();
    expect(screen.getByText("Muted")).toBeInTheDocument();
  });

  it("does not render notification settings when wave is muted", () => {
    renderComponent(mockWaveMuted);

    expect(
      screen.queryByLabelText("Receive ALL mention notifications")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Receive all drop notifications")
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
      expect(mockAuthContext.setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.stringMatching(/Unable to unmute wave/i),
          title: expect.stringMatching(/unmute this wave/i),
          type: "error",
        })
      );
    });
  });
});
