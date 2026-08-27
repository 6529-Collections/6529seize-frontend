import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProfileBlockActionMenu from "@/components/user/user-page-header/ProfileBlockActionMenu";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import useProfileMute from "@/hooks/useProfileMute";

jest.mock("@/hooks/useIsMobileLayoutViewport", () => jest.fn());
jest.mock("@/hooks/useProfileMute", () => jest.fn());
jest.mock("@/components/compact-menu", () => ({
  CompactMenu: ({
    items,
  }: {
    readonly items: readonly {
      readonly id: string;
      readonly label: ReactNode;
      readonly icon?: ReactNode;
      readonly onSelect?: () => void;
      readonly disabled?: boolean;
    }[];
  }) => (
    <div data-testid="desktop-profile-actions">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={item.disabled}
          onClick={item.onSelect}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  ),
}));
jest.mock(
  "@/components/compact-menu/CompactMenuMobileBottomSheet",
  () =>
    ({
      items,
    }: {
      readonly items: readonly {
        readonly id: string;
        readonly label: ReactNode;
        readonly icon?: ReactNode;
        readonly onSelect?: () => void;
        readonly disabled?: boolean;
      }[];
    }) => (
      <div data-testid="mobile-profile-actions">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            onClick={item.onSelect}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    )
);

const useIsMobileLayoutViewportMock = jest.mocked(useIsMobileLayoutViewport);
const useProfileMuteMock = jest.mocked(useProfileMute);

describe("ProfileBlockActionMenu", () => {
  const toggleMute = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobileLayoutViewportMock.mockReturnValue(false);
    useProfileMuteMock.mockReturnValue({
      isMuted: false,
      isPending: false,
      toggleMute,
    });
  });

  it("puts mute and block actions with icons in the desktop overflow menu", async () => {
    const user = userEvent.setup();
    const onBlock = jest.fn();
    render(
      <ProfileBlockActionMenu
        handle="alice"
        disabled={false}
        onBlock={onBlock}
      />
    );

    const menu = screen.getByTestId("desktop-profile-actions");
    const mute = within(menu).getByRole("button", {
      name: "Mute notifications",
    });
    const block = within(menu).getByRole("button", {
      name: "Block profile",
    });
    expect(mute.querySelector("svg")).not.toBeNull();
    expect(block.querySelector("svg")).not.toBeNull();

    await user.click(mute);
    await user.click(block);
    expect(toggleMute).toHaveBeenCalledTimes(1);
    expect(onBlock).toHaveBeenCalledTimes(1);
  });

  it("uses the same icon actions in the mobile bottom sheet", () => {
    useIsMobileLayoutViewportMock.mockReturnValue(true);
    useProfileMuteMock.mockReturnValue({
      isMuted: true,
      isPending: false,
      toggleMute,
    });

    render(
      <ProfileBlockActionMenu
        handle="alice"
        disabled={false}
        onBlock={jest.fn()}
      />
    );

    const menu = screen.getByTestId("mobile-profile-actions");
    const unmute = within(menu).getByRole("button", {
      name: "Unmute notifications",
    });
    const block = within(menu).getByRole("button", {
      name: "Block profile",
    });
    expect(unmute.querySelector("svg")).not.toBeNull();
    expect(block.querySelector("svg")).not.toBeNull();
  });

  it("can show a moderator action independently of personal profile actions", async () => {
    const user = userEvent.setup();
    const onSuspend = jest.fn();

    render(
      <ProfileBlockActionMenu
        handle="alice"
        disabled={false}
        showPersonalActions={false}
        moderationAction={{
          kind: "suspend",
          label: "Suspend Profile",
          onSelect: onSuspend,
        }}
        onBlock={jest.fn()}
      />
    );

    const menu = screen.getByTestId("desktop-profile-actions");
    expect(
      within(menu).queryByRole("button", { name: "Mute notifications" })
    ).not.toBeInTheDocument();
    expect(
      within(menu).queryByRole("button", { name: "Block profile" })
    ).not.toBeInTheDocument();
    const suspend = within(menu).getByRole("button", {
      name: "Suspend Profile",
    });
    expect(suspend.querySelector("svg")).not.toBeNull();

    await user.click(suspend);
    expect(onSuspend).toHaveBeenCalledTimes(1);
  });
});
