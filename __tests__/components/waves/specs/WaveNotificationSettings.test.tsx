import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext, type ReactNode } from "react";
import WaveNotificationSettings from "@/components/waves/specs/WaveNotificationSettings";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { useWaveNotificationSubscription } from "@/hooks/useWaveNotificationSubscription";
import { commonApiPost, commonApiDelete } from "@/services/api/common-api";
import { WaveInformationPanelContext } from "@/components/brain/mobile/WaveInformationPanelContext";

jest.mock("@/hooks/useWaveNotificationSubscription", () => ({
  useWaveNotificationSubscription: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));
const mockInvalidate = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));

const wave = {
  id: "wave-123",
  name: "Test Wave",
  metrics: { subscribers_count: 1500, muted: false },
  subscribed_actions: ["DROP_CREATED"],
} as ApiWave;
const setToast = jest.fn();
const refetch = jest.fn();
const mockSubscription = jest.mocked(useWaveNotificationSubscription);
const mockPost = jest.mocked(commonApiPost);
const mockDelete = jest.mocked(commonApiDelete);
const ALL = "All messages";
const BROADCAST = "@all and mentions";
const MENTIONS = "Mentions only";
const groups = [ApiDropGroupMention.All];

function TestAuthProvider({ children }: { readonly children: ReactNode }) {
  const auth = useContext(AuthContext);
  return (
    <AuthContext.Provider value={{ ...auth, setToast }}>
      {children}
    </AuthContext.Provider>
  );
}

function setPreferences(subscribed: boolean, enabled = groups) {
  mockSubscription.mockReturnValue({
    data: { subscribed, enabled_group_notifications: enabled },
    refetch,
  } as unknown as ReturnType<typeof useWaveNotificationSubscription>);
}
function renderComponent(currentWave = wave, compact = false) {
  return render(
    <TestAuthProvider>
      <WaveNotificationSettings wave={currentWave} compact={compact} />
    </TestAuthProvider>
  );
}
async function openMenu() {
  const trigger = screen.getByRole("button", {
    name: "Open notification settings",
  });
  await userEvent.click(trigger);
  return trigger;
}
function choice(name: string) {
  return screen.getByRole("menuitemradio", { name });
}

describe("WaveNotificationSettings", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
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
    setPreferences(false, []);
    mockPost.mockResolvedValue({});
    mockDelete.mockResolvedValue(undefined);
  });

  it("replaces both controls with one neutral bell and three radio choices", async () => {
    renderComponent();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    const trigger = await openMenu();
    expect(trigger).not.toHaveClass(
      "tw-bg-primary-400/10",
      "tw-text-primary-400"
    );
    expect(screen.getByRole("menu")).toHaveAttribute(
      "aria-labelledby",
      trigger.id
    );
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(3);
    expect(
      screen.getByRole("group", { name: "Notification level" })
    ).toContainElement(choice(MENTIONS));
    expect(screen.queryByText("Notify me about")).not.toBeInTheDocument();
    expect(screen.getByText("Every new post")).toBeInTheDocument();
    expect(
      screen.getByText("Mentions, @all, @contributors")
    ).toBeInTheDocument();
    expect(screen.getByText("Mentions and replies to you")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mute wave" })).toBeEnabled();
    expect(
      screen.getByRole("menuitem", { name: "Mute wave" })
    ).toHaveAccessibleDescription("No alerts");
    expect(screen.getByText("No alerts")).toBeInTheDocument();
  });

  it.each([
    [false, [], MENTIONS],
    [false, groups, BROADCAST],
    [true, [], ALL],
    [true, groups, ALL],
  ])(
    "reads legacy preferences %s / %j as one selected level",
    async (subscribed, enabled, selected) => {
      setPreferences(subscribed, enabled);
      renderComponent();
      await openMenu();
      for (const name of [ALL, BROADCAST, MENTIONS]) {
        expect(choice(name)).toHaveAttribute(
          "aria-checked",
          String(name === selected)
        );
      }
    }
  );

  it("keeps the desktop dropdown inside About without opening a subview", async () => {
    const openSubview = jest.fn();
    render(
      <WaveInformationPanelContext.Provider
        value={{
          view: "about",
          contentId: "about-subview",
          container: null,
          open: openSubview,
          back: jest.fn(),
        }}
      >
        <TestAuthProvider>
          <WaveNotificationSettings wave={wave} />
        </TestAuthProvider>
      </WaveInformationPanelContext.Provider>
    );
    await openMenu();
    expect(screen.getByRole("menu")).toBeVisible();
    expect(openSubview).not.toHaveBeenCalled();
  });

  it.each([
    [false, [], ALL, true, groups],
    [false, [], BROADCAST, false, groups],
    [false, groups, MENTIONS, false, []],
    [true, groups, BROADCAST, false, groups],
    [true, groups, MENTIONS, false, []],
    [false, groups, ALL, true, groups],
    [true, [], BROADCAST, false, groups],
  ])(
    "saves the chosen level in one request from %s / %j to %s",
    async (subscribed, enabled, target, nextSubscribed, nextGroups) => {
      setPreferences(subscribed, enabled);
      renderComponent();
      await openMenu();
      await userEvent.click(choice(target));
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith({
        endpoint: "notifications/wave-subscription/wave-123",
        body: {
          subscribed: nextSubscribed,
          enabled_group_notifications: nextGroups,
        },
      });
      expect(refetch).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    }
  );

  it.each([undefined, null])(
    "tolerates an omitted or null group preference array (%s)",
    async (enabled) => {
      mockSubscription.mockReturnValue({
        data: { subscribed: false, enabled_group_notifications: enabled },
        refetch,
      } as unknown as ReturnType<typeof useWaveNotificationSubscription>);
      renderComponent();
      await openMenu();
      expect(choice(MENTIONS)).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("menuitem", { name: "Mute wave" })).toBeEnabled();
    }
  );

  it("closes without toggling off the already selected level", async () => {
    renderComponent();
    await openMenu();
    await userEvent.click(choice(MENTIONS));
    expect(mockPost).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "offers only mute or unmute before joining (muted: %s)",
    async (muted) => {
      renderComponent({
        ...wave,
        subscribed_actions: [],
        metrics: { ...wave.metrics, muted },
      });
      await openMenu();
      expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
      const item = screen.getByRole("menuitem", {
        name: muted ? "Unmute wave" : "Mute wave",
      });
      await userEvent.click(item);
      if (muted)
        expect(mockDelete).toHaveBeenCalledWith({
          endpoint: "waves/wave-123/mute",
        });
      else
        expect(mockPost).toHaveBeenCalledWith({
          endpoint: "waves/wave-123/mute",
          body: {},
        });
    }
  );

  it("offers only mute when unjoined preferences are unavailable", async () => {
    mockSubscription.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useWaveNotificationSubscription>);
    renderComponent({ ...wave, subscribed_actions: [] });
    await openMenu();
    expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Retry notification settings" })
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "Mute wave" }));
    expect(mockPost).toHaveBeenCalledWith({
      endpoint: "waves/wave-123/mute",
      body: {},
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it("keeps the selected level visible but disabled while muted", async () => {
    setPreferences(true, []);
    renderComponent({ ...wave, metrics: { ...wave.metrics, muted: true } });
    await openMenu();
    expect(choice(ALL)).toHaveAttribute("aria-checked", "true");
    for (const item of screen.getAllByRole("menuitemradio"))
      expect(item).toBeDisabled();
    const unmute = screen.getByRole("menuitem", { name: "Unmute wave" });
    expect(unmute).toBeEnabled();
    await userEvent.click(choice(BROADCAST));
    expect(mockPost).not.toHaveBeenCalled();
    await userEvent.click(unmute);
    expect(mockDelete).toHaveBeenCalledWith({
      endpoint: "waves/wave-123/mute",
    });
    expect(mockInvalidate).toHaveBeenCalledTimes(4);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps mute available while preferences load", async () => {
    mockSubscription.mockReturnValue({
      data: undefined,
      isPending: true,
      refetch,
    } as unknown as ReturnType<typeof useWaveNotificationSubscription>);
    renderComponent();
    await openMenu();
    for (const item of screen.getAllByRole("menuitemradio")) {
      expect(item).toBeDisabled();
      expect(item).toHaveAttribute("aria-checked", "false");
    }
    await userEvent.click(choice(ALL));
    expect(mockPost).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("menuitem", { name: "Mute wave" }));
    expect(mockPost).toHaveBeenCalledWith({
      endpoint: "waves/wave-123/mute",
      body: {},
    });
  });

  it("retries unavailable preferences inside the menu with mute still available", async () => {
    mockSubscription.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      refetch,
    } as unknown as ReturnType<typeof useWaveNotificationSubscription>);
    renderComponent();
    await openMenu();
    expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mute wave" })).toBeEnabled();
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Retry notification settings" })
    );
    expect(refetch).toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it.each([
    [false, [], ALL, "API Error"],
    [false, groups, MENTIONS, "Unable to update subscription"],
  ])(
    "preserves error feedback and prior preference on failure",
    async (subscribed, enabled, target, error) => {
      setPreferences(subscribed, enabled);
      mockPost.mockRejectedValue(error);
      renderComponent();
      await openMenu();
      await userEvent.click(choice(target));
      await waitFor(() =>
        expect(setToast).toHaveBeenCalledWith({
          title: "Couldn't update notification settings.",
          description: "Please try again.",
          details: `${error}.`,
          type: "error",
        })
      );
      await openMenu();
      expect(choice(target)).toHaveAttribute("aria-checked", "false");
    }
  );

  it.each([false, true])(
    "preserves mute error feedback (muted: %s)",
    async (muted) => {
      const api = muted ? mockDelete : mockPost;
      api.mockRejectedValue(new Error("Request failed"));
      renderComponent({ ...wave, metrics: { ...wave.metrics, muted } });
      await openMenu();
      await userEvent.click(
        screen.getByRole("menuitem", {
          name: muted ? "Unmute wave" : "Mute wave",
        })
      );
      await waitFor(() =>
        expect(setToast).toHaveBeenCalledWith({
          title: muted
            ? "Couldn't unmute this wave."
            : "Couldn't mute this wave.",
          description: "Please try again.",
          details: "Request failed.",
          type: "error",
        })
      );
    }
  );

  it.each(["preference", "mute", "unmute"])(
    "shows per-row loading and prevents overlapping writes for %s",
    async (operation) => {
      let finish: () => void = () => {};
      const api = operation === "unmute" ? mockDelete : mockPost;
      api.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          })
      );
      renderComponent({
        ...wave,
        metrics: { ...wave.metrics, muted: operation === "unmute" },
      });
      await openMenu();
      const target =
        operation === "preference"
          ? choice(ALL)
          : screen.getByRole("menuitem", {
              name: operation === "unmute" ? "Unmute wave" : "Mute wave",
            });
      await userEvent.click(target);
      const trigger = await openMenu();
      expect(trigger).toHaveAttribute("aria-busy", "true");
      expect(
        screen.getByRole("menu").querySelector(".spinner")
      ).toBeInTheDocument();
      for (const item of screen.getAllByRole("menuitemradio"))
        expect(item).toBeDisabled();
      expect(
        screen.getByRole("menuitem", {
          name: operation === "unmute" ? "Unmute wave" : "Mute wave",
        })
      ).toBeDisabled();
      await act(async () => finish());
      await waitFor(() =>
        expect(trigger).toHaveAttribute("aria-busy", "false")
      );
    }
  );

  it("retains the same focused bell across compact and muted states", () => {
    const view = (compact: boolean, muted: boolean) => (
      <TestAuthProvider>
        <WaveNotificationSettings
          wave={{ ...wave, metrics: { ...wave.metrics, muted } }}
          compact={compact}
        />
      </TestAuthProvider>
    );
    const { rerender } = render(view(false, false));
    const trigger = screen.getByRole("button", {
      name: "Open notification settings",
    });
    trigger.focus();
    for (const [compact, muted] of [
      [true, false],
      [true, true],
      [false, true],
    ] as const) {
      rerender(view(compact, muted));
      expect(
        screen.getByRole("button", { name: "Open notification settings" })
      ).toBe(trigger);
      expect(trigger).toHaveFocus();
      expect(screen.getAllByRole("button")).toHaveLength(1);
    }
  });
});
