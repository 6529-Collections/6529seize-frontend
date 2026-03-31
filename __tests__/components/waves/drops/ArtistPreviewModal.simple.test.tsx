import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ArtistPreviewModal } from "@/components/waves/drops/ArtistPreviewModal";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";

const mockUseDeviceInfo = jest.fn();

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDeviceInfo(...args),
}));

jest.mock("@headlessui/react", () => ({
  Dialog: ({ children, onClose: _onClose, ...props }: any) => (
    <div data-testid="dialog" {...props}>
      {children}
    </div>
  ),
  DialogPanel: ({ children, ...props }: any) => (
    <div data-testid="dialog-panel" {...props}>
      {children}
    </div>
  ),
  Transition: ({ children, show }: any) => (show ? <>{children}</> : null),
  TransitionChild: ({ children }: any) => <>{children}</>,
}));

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: any) => node,
}));

jest.mock("@/components/waves/drops/ArtistPreviewModalContent", () => ({
  ArtistPreviewModalContent: () => (
    <div data-testid="artist-preview-modal-content">Content</div>
  ),
}));

jest.mock("@/components/waves/drops/ArtistPreviewAppWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="app-wrapper">{children}</div>
  ),
}));

describe("ArtistPreviewModal", () => {
  const mockUser: ApiProfileMin = {
    id: "user-123",
    handle: "test-artist",
    pfp: "https://example.com/avatar.jpg",
    banner1_color: null,
    banner2_color: null,
    level: 1,
    cic: 100,
    rep: 50,
    tdh: 0,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    primary_address: "0x123",
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    is_wave_creator: false,
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    user: mockUser,
    activeTab: "active" as const,
    onTabChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeviceInfo.mockReturnValue({ isApp: false });
    document.body.style.overflow = "";
  });

  it("should exist and be exportable", () => {
    expect(ArtistPreviewModal).toBeDefined();
    expect(typeof ArtistPreviewModal).toBe("function");
  });

  it("renders the modal content when open on desktop", () => {
    render(<ArtistPreviewModal {...defaultProps} />);

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getAllByTestId("artist-preview-modal-content")).toHaveLength(
      2
    );
  });

  it("locks body overflow on desktop and restores it on unmount", () => {
    document.body.style.overflow = "scroll";

    const { unmount } = render(<ArtistPreviewModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("scroll");
  });

  it("does not mutate body overflow in app mode", () => {
    mockUseDeviceInfo.mockReturnValue({ isApp: true });
    document.body.style.overflow = "scroll";

    render(<ArtistPreviewModal {...defaultProps} />);

    expect(screen.getByTestId("app-wrapper")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("does not render when isOpen is false", () => {
    render(<ArtistPreviewModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-wrapper")).not.toBeInTheDocument();
  });
});
