import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";

const mockUseDeviceInfo = jest.fn(() => ({
  hasTouchScreen: false,
}));

// Mock the CustomTooltip component
jest.mock("@/components/utils/tooltip/CustomTooltip", () => {
  const React = require("react");
  const {
    CUSTOM_TOOLTIP_CLOSE_ALL_EVENT,
  } = require("@/helpers/tooltip.helpers");

  return function MockCustomTooltip({
    children,
    content,
    placement,
    delayShow,
    delayHide,
  }: {
    children: React.ReactElement;
    content: React.ReactNode;
    placement?: string | undefined;
    delayShow?: number | undefined;
    delayHide?: number | undefined;
  }) {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
      const handleCloseAll = () => setIsVisible(false);
      document.addEventListener(CUSTOM_TOOLTIP_CLOSE_ALL_EVENT, handleCloseAll);
      return () => {
        document.removeEventListener(
          CUSTOM_TOOLTIP_CLOSE_ALL_EVENT,
          handleCloseAll
        );
      };
    }, []);

    return (
      <div
        data-testid="custom-tooltip"
        data-placement={placement}
        data-delay-show={delayShow}
        data-delay-hide={delayHide}
      >
        {children}
        {isVisible && <div data-testid="tooltip-content">{content}</div>}
      </div>
    );
  };
});

// Mock UserProfileTooltip component
jest.mock("@/components/user/utils/profile/UserProfileTooltip", () => {
  const {
    CUSTOM_TOOLTIP_CLOSE_ALL_EVENT,
  } = require("@/helpers/tooltip.helpers");

  return function MockUserProfileTooltip({
    user,
    onArtistPreviewOpen,
    onWaveCreatorPreviewOpen,
  }: {
    user: string;
    onArtistPreviewOpen?: ((params: any) => void) | undefined;
    onWaveCreatorPreviewOpen?: ((user: any) => void) | undefined;
  }) {
    const artistUser = {
      id: "artist-1",
      handle: user,
      primary_address: "0xartist",
      subscribed_actions: [],
      active_main_stage_submission_ids: [],
      winner_main_stage_drop_ids: [],
      artist_of_prevote_cards: [],
    };

    return (
      <div data-testid="user-profile-tooltip">
        <span>Profile for {user}</span>
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(new Event(CUSTOM_TOOLTIP_CLOSE_ALL_EVENT));
            onArtistPreviewOpen?.({ user: artistUser, initialTab: "winners" });
          }}
        >
          Open Artist Preview
        </button>
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(new Event(CUSTOM_TOOLTIP_CLOSE_ALL_EVENT));
            onWaveCreatorPreviewOpen?.(artistUser);
          }}
        >
          Open Wave Creator Preview
        </button>
      </div>
    );
  };
});

jest.mock("@/components/waves/drops/ArtistPreviewModal", () => ({
  ArtistPreviewModal: ({ isOpen, user, activeTab }: any) =>
    isOpen ? (
      <div
        data-testid="artist-preview-modal"
        data-user-handle={user.handle}
        data-active-tab={activeTab}
      />
    ) : null,
}));

jest.mock("@/components/waves/drops/WaveCreatorPreviewModal", () => ({
  WaveCreatorPreviewModal: ({ isOpen, user }: any) =>
    isOpen ? (
      <div
        data-testid="wave-creator-preview-modal"
        data-user-handle={user.handle}
      />
    ) : null,
}));

// Mock useDeviceInfo hook
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDeviceInfo(...args),
}));

describe("UserProfileTooltipWrapper", () => {
  beforeEach(() => {
    mockUseDeviceInfo.mockReturnValue({
      hasTouchScreen: false,
    });
  });

  it("renders with default placement", () => {
    render(
      <UserProfileTooltipWrapper user="testuser">
        <button>Test Button</button>
      </UserProfileTooltipWrapper>
    );

    expect(screen.getByText("Test Button")).toBeInTheDocument();
    expect(screen.getByTestId("custom-tooltip")).toHaveAttribute(
      "data-placement",
      "auto"
    );
    expect(screen.getByTestId("custom-tooltip")).toHaveAttribute(
      "data-delay-show",
      "500"
    );
    expect(screen.getByTestId("custom-tooltip")).toHaveAttribute(
      "data-delay-hide",
      "0"
    );
    expect(screen.getByText("Profile for testuser")).toBeInTheDocument();
  });

  it("renders with custom placement", () => {
    render(
      <UserProfileTooltipWrapper user="testuser" placement="top">
        <button>Test Button</button>
      </UserProfileTooltipWrapper>
    );

    expect(screen.getByText("Test Button")).toBeInTheDocument();
    expect(screen.getByTestId("custom-tooltip")).toHaveAttribute(
      "data-placement",
      "top"
    );
  });

  it("opens artist preview above the tooltip after the tooltip closes", () => {
    render(
      <UserProfileTooltipWrapper user="testuser">
        <button>Test Button</button>
      </UserProfileTooltipWrapper>
    );

    fireEvent.click(screen.getByText("Open Artist Preview"));

    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("artist-preview-modal")).toHaveAttribute(
      "data-user-handle",
      "testuser"
    );
    expect(screen.getByTestId("artist-preview-modal")).toHaveAttribute(
      "data-active-tab",
      "winners"
    );
  });

  it("opens wave creator preview above the tooltip after the tooltip closes", () => {
    render(
      <UserProfileTooltipWrapper user="testuser">
        <button>Test Button</button>
      </UserProfileTooltipWrapper>
    );

    fireEvent.click(screen.getByText("Open Wave Creator Preview"));

    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("wave-creator-preview-modal")).toHaveAttribute(
      "data-user-handle",
      "testuser"
    );
  });

  it("renders children only on touch devices", () => {
    mockUseDeviceInfo.mockReturnValue({
      hasTouchScreen: true,
    });

    render(
      <UserProfileTooltipWrapper user="testuser">
        <button>Test Button</button>
      </UserProfileTooltipWrapper>
    );

    expect(screen.getByText("Test Button")).toBeInTheDocument();
    expect(screen.queryByTestId("custom-tooltip")).not.toBeInTheDocument();
  });
});
