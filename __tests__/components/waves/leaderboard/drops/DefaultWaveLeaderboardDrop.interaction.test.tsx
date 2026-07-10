import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DefaultWaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: () => "/",
  useSearchParams: () => ({ toString: () => "", get: () => null }),
}));
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => jest.fn());
jest.mock("@/hooks/isMobileScreen", () => jest.fn());
jest.mock("@/hooks/useLongPressInteraction", () => jest.fn());
jest.mock("@/utils/monitoring/dropOpenTiming", () => ({
  startDropOpen: jest.fn(),
}));
jest.mock("@/components/voting", () => ({
  VotingModal: (p: any) => <div data-testid="modal">{String(p.isOpen)}</div>,
  MobileVotingModal: (p: any) => (
    <div data-testid="mobile">{String(p.isOpen)}</div>
  ),
}));
jest.mock("@/components/voting/VotingModalButton", () => (p: any) => (
  <button data-testid="vote-btn" onClick={p.onClick} />
));
jest.mock("@/components/waves/drops/WaveDropActionsOptions", () => ({
  __esModule: true,
  default: () => <div data-testid="options" />,
}));
jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => ({
  __esModule: true,
  default: () => <div />,
}));
jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => (p: any) => (
  <button
    type="button"
    data-testid="mobile-open"
    onClick={() => p.onOpenChange(false)}
  />
));
jest.mock(
  "@/components/waves/drops/WaveDropMobileMenuCopyLink",
  () => (p: any) => (
    <button
      type="button"
      data-testid="mobile-copy"
      onClick={() => p.onCopy()}
    />
  )
);
jest.mock(
  "@/components/waves/drops/WaveDropMobileMenuDelete",
  () => (p: any) => (
    <button
      type="button"
      data-testid="mobile-delete"
      onClick={() => p.onDropDeleted()}
    />
  )
);
jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => (p: any) =>
    p.isOpen ? (
      <div data-testid="mobile-wrapper">
        <button
          type="button"
          data-testid="mobile-backdrop"
          onClick={() => p.setOpen(false)}
        />
        {p.children}
      </div>
    ) : null
);
jest.mock(
  "@/components/waves/leaderboard/drops/header/WaveLeaderboardDropHeader",
  () => ({ WaveLeaderboardDropHeader: () => <div data-testid="header" /> })
);
jest.mock(
  "@/components/waves/leaderboard/content/WaveLeaderboardDropContent",
  () => ({ WaveLeaderboardDropContent: () => <div data-testid="content" /> })
);
jest.mock(
  "@/components/waves/leaderboard/drops/header/WaveleaderboardDropRaters",
  () => ({
    WaveLeaderboardDropRaters: () => (
      <button
        type="button"
        data-testid="vote-details-trigger"
        onClick={(event) => event.stopPropagation()}
      >
        vote details
      </button>
    ),
  })
);

const useRules = require("@/hooks/drops/useDropInteractionRules")
  .useDropInteractionRules as jest.Mock;
const useDeviceInfo = require("@/hooks/useDeviceInfo") as jest.Mock;
const useIsMobileScreen = require("@/hooks/isMobileScreen") as jest.Mock;
const useLongPressInteraction =
  require("@/hooks/useLongPressInteraction") as jest.Mock;
const { startDropOpen } = require("@/utils/monitoring/dropOpenTiming") as {
  startDropOpen: jest.Mock;
};

const wave = { id: "w1" } as any;
const drop = {
  id: "d1",
  wave,
  rank: 1,
  author: {
    handle: "testuser",
    pfp: null,
    level: 1,
    cic: 0,
  },
  created_at: new Date().toISOString(),
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  useLongPressInteraction.mockReturnValue({
    isActive: false,
    setIsActive: jest.fn(),
    touchHandlers: {},
  });
});

test("opens voting modal when button clicked", async () => {
  const user = userEvent.setup();
  useRules.mockReturnValue({ canShowVote: true, canDelete: true });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  render(
    <DefaultWaveLeaderboardDrop
      drop={drop}
      wave={wave}
      onDropClick={jest.fn()}
    />
  );
  expect(screen.getByTestId("modal")).toHaveTextContent("false");
  await user.click(screen.getByTestId("vote-btn"));
  expect(screen.getByTestId("modal")).toHaveTextContent("true");
  expect(screen.getByTestId("options")).toBeInTheDocument();
});

test("uses mobile modal and hides options when cannot delete", () => {
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(true);
  useLongPressInteraction.mockReturnValue({
    isActive: false,
    setIsActive: jest.fn(),
    touchHandlers: {},
  });
  render(
    <DefaultWaveLeaderboardDrop
      drop={drop}
      wave={wave}
      onDropClick={jest.fn()}
    />
  );
  expect(screen.getByTestId("mobile")).toHaveTextContent("false");
  expect(screen.queryByTestId("options")).toBeNull();
});

test("keeps native touch scrolling enabled for long-press handlers", () => {
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);

  render(
    <DefaultWaveLeaderboardDrop
      drop={drop}
      wave={wave}
      onDropClick={jest.fn()}
    />
  );

  expect(useLongPressInteraction).toHaveBeenCalledWith(
    expect.objectContaining({
      hasTouchScreen: true,
      preventDefault: false,
    })
  );
});

test("opens drop on normal card click", () => {
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);
  const onDropClick = jest.fn();

  const { container } = render(
    <DefaultWaveLeaderboardDrop drop={drop} onDropClick={onDropClick} />
  );

  fireEvent.click(container.firstElementChild as HTMLElement);

  expect(startDropOpen).toHaveBeenCalledWith({
    dropId: "d1",
    waveId: "w1",
    source: "leaderboard_list",
    isMobile: true,
  });
  expect(onDropClick).toHaveBeenCalledWith(drop);
});

test("does not open drop when vote details trigger is clicked", () => {
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  const onDropClick = jest.fn();

  render(<DefaultWaveLeaderboardDrop drop={drop} onDropClick={onDropClick} />);

  fireEvent.click(screen.getByTestId("vote-details-trigger"));

  expect(startDropOpen).not.toHaveBeenCalled();
  expect(onDropClick).not.toHaveBeenCalled();
});

test("does not open drop from synthetic click after long press", () => {
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);
  const onDropClick = jest.fn();

  const { container } = render(
    <DefaultWaveLeaderboardDrop drop={drop} onDropClick={onDropClick} />
  );
  const hookOptions = useLongPressInteraction.mock.calls[0][0];

  hookOptions.onInteractionStart();
  fireEvent.click(container.firstElementChild as HTMLElement);

  expect(startDropOpen).not.toHaveBeenCalled();
  expect(onDropClick).not.toHaveBeenCalled();
});

test("consumes synthetic click from portaled mobile menu after long press", () => {
  const setIsActive = jest.fn();
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);
  useLongPressInteraction.mockReturnValue({
    isActive: true,
    setIsActive,
    touchHandlers: {},
  });
  const onDropClick = jest.fn();

  render(<DefaultWaveLeaderboardDrop drop={drop} onDropClick={onDropClick} />);
  const hookOptions = useLongPressInteraction.mock.calls[0][0];

  hookOptions.onInteractionStart();
  fireEvent.click(screen.getByTestId("mobile-backdrop"));

  expect(setIsActive).not.toHaveBeenCalled();
  expect(startDropOpen).not.toHaveBeenCalled();
  expect(onDropClick).not.toHaveBeenCalled();
});

test("allows real mobile menu tap after pending long-press click is cleared", () => {
  const setIsActive = jest.fn();
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);
  useLongPressInteraction.mockReturnValue({
    isActive: true,
    setIsActive,
    touchHandlers: {},
  });

  render(<DefaultWaveLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);
  const hookOptions = useLongPressInteraction.mock.calls[0][0];
  const mobileOpen = screen.getByTestId("mobile-open");

  hookOptions.onInteractionStart();
  fireEvent.touchStart(mobileOpen);
  fireEvent.click(mobileOpen);

  expect(setIsActive).toHaveBeenCalledWith(false);
});

test("shows copy link in the touch action sheet", () => {
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);
  useLongPressInteraction.mockReturnValue({
    isActive: true,
    setIsActive: jest.fn(),
    touchHandlers: {},
  });

  render(
    <DefaultWaveLeaderboardDrop
      drop={drop}
      wave={wave}
      onDropClick={jest.fn()}
    />
  );

  expect(screen.getByTestId("mobile-copy")).toBeInTheDocument();
});
