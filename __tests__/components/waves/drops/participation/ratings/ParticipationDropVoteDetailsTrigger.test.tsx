import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { useDropVoteLogs } from "@/hooks/useDropVoteLogs";
import { useDropVoters } from "@/hooks/useDropVoters";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

jest.mock("@/hooks/isMobileScreen");
jest.mock("@/hooks/useIsTouchDevice");
jest.mock("@/hooks/useDropVoters");
jest.mock("@/hooks/useDropVoteLogs");
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: () => ({ current: null }),
}));
jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    children,
    isOpen,
    title,
  }: {
    readonly children: ReactNode;
    readonly isOpen: boolean;
    readonly title?: string | undefined;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title} data-testid="mobile-sheet">
        {children}
      </div>
    ) : null,
}));

const mockUseDropVoters = useDropVoters as jest.Mock;
const mockUseDropVoteLogs = useDropVoteLogs as jest.Mock;
const mockUseIsMobileScreen = useIsMobileScreen as jest.Mock;
const mockUseIsTouchDevice = useIsTouchDevice as jest.Mock;

type ResizeObserverGlobal = typeof globalThis & {
  ResizeObserver?: typeof ResizeObserver;
};

const installResizeObserverMock = () => {
  const resizeObserverGlobal = globalThis as ResizeObserverGlobal;
  const originalResizeObserver = resizeObserverGlobal.ResizeObserver;
  let callback: ResizeObserverCallback | null = null;
  const observe = jest.fn();
  const disconnect = jest.fn();

  resizeObserverGlobal.ResizeObserver = jest
    .fn()
    .mockImplementation((nextCallback: ResizeObserverCallback) => {
      callback = nextCallback;
      return {
        observe,
        disconnect,
      };
    }) as unknown as typeof ResizeObserver;

  return {
    observe,
    disconnect,
    trigger: () => callback?.([], {} as ResizeObserver),
    restore: () => {
      if (originalResizeObserver) {
        resizeObserverGlobal.ResizeObserver = originalResizeObserver;
        return;
      }

      delete resizeObserverGlobal.ResizeObserver;
    },
  };
};

const drop = {
  id: "drop-1",
  rating: 100,
  raters_count: 21,
  wave: {
    voting_credit_type: ApiWaveCreditType.Tdh,
  },
} as any;

const voter = {
  voter: {
    id: "v1",
    handle: "alice",
    primary_address: "0x123",
  },
  vote: 100,
};

describe("ParticipationDropVoteDetailsTrigger", () => {
  let restoreResizeObserver: (() => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobileScreen.mockReturnValue(false);
    mockUseIsTouchDevice.mockReturnValue(false);
    mockUseDropVoters.mockReturnValue({
      voters: [voter],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockUseDropVoteLogs.mockReturnValue({
      logs: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    restoreResizeObserver?.();
    restoreResizeObserver = null;
  });

  it("opens a desktop popover and stops parent click propagation", async () => {
    const user = userEvent.setup();
    const parentClick = jest.fn();

    render(
      <div onClick={parentClick}>
        <ParticipationDropVoteDetailsTrigger drop={drop} />
      </div>
    );

    await user.click(
      screen.getByRole("button", { name: "Open votes from 21 voters" })
    );

    expect(parentClick).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("dialog", { name: "Votes" })
    ).toBeInTheDocument();
    expect(screen.getByText("+100 TDH")).toBeInTheDocument();
    expect(mockUseDropVoters).toHaveBeenLastCalledWith({
      dropId: "drop-1",
      enabled: true,
    });
    expect(mockUseDropVoteLogs).toHaveBeenLastCalledWith({
      dropId: "drop-1",
      enabled: false,
    });
  });

  it("moves focus into the desktop dialog when opened", async () => {
    const user = userEvent.setup();

    render(<ParticipationDropVoteDetailsTrigger drop={drop} />);

    const trigger = screen.getByRole("button", {
      name: "Open votes from 21 voters",
    });
    trigger.focus();
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Votes" });

    await waitFor(() => expect(dialog).toHaveFocus());
  });

  it("keeps keyboard tab focus inside the desktop dialog", async () => {
    const user = userEvent.setup();

    render(<ParticipationDropVoteDetailsTrigger drop={drop} />);

    await user.click(
      screen.getByRole("button", { name: "Open votes from 21 voters" })
    );
    const dialog = await screen.findByRole("dialog", { name: "Votes" });
    await waitFor(() => expect(dialog).toHaveFocus());

    screen.getByRole("link", { name: "alice" }).focus();
    await user.tab();

    expect(
      screen.getByRole("button", { name: "Close votes" })
    ).toHaveFocus();
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();

    render(<ParticipationDropVoteDetailsTrigger drop={drop} />);

    const trigger = screen.getByRole("button", {
      name: "Open votes from 21 voters",
    });
    trigger.focus();
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Votes" });
    await waitFor(() => expect(dialog).toHaveFocus());

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Votes" })
      ).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it("repositions the desktop popover after its size changes", async () => {
    const user = userEvent.setup();
    const resizeObserver = installResizeObserverMock();
    restoreResizeObserver = resizeObserver.restore;

    render(<ParticipationDropVoteDetailsTrigger drop={drop} />);

    const trigger = screen.getByRole("button", {
      name: "Open votes from 21 voters",
    });
    trigger.getBoundingClientRect = jest.fn(() => ({
      bottom: 500,
      height: 20,
      left: 40,
      right: 100,
      top: 480,
      width: 60,
      x: 40,
      y: 480,
      toJSON: () => ({}),
    }));

    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Votes" });
    const popover = dialog.parentElement as HTMLElement;

    await waitFor(() => expect(popover.style.top).toBe("508px"));
    await waitFor(() => {
      expect(resizeObserver.observe).toHaveBeenCalledWith(dialog);
    });

    Object.defineProperty(dialog, "offsetHeight", {
      configurable: true,
      value: 300,
    });

    act(() => {
      resizeObserver.trigger();
    });

    await waitFor(() => expect(popover.style.top).toBe("172px"));
  });

  it("opens a mobile sheet on mobile screens", async () => {
    const user = userEvent.setup();
    const resizeObserver = installResizeObserverMock();
    restoreResizeObserver = resizeObserver.restore;
    mockUseIsMobileScreen.mockReturnValue(true);

    render(<ParticipationDropVoteDetailsTrigger drop={drop} />);

    await user.click(
      screen.getByRole("button", { name: "Open votes from 21 voters" })
    );

    expect(screen.getByTestId("mobile-sheet")).toBeInTheDocument();
    expect(resizeObserver.observe).not.toHaveBeenCalled();
  });

  it("loads vote logs only after selecting the log tab", async () => {
    const user = userEvent.setup();

    render(<ParticipationDropVoteDetailsTrigger drop={drop} />);

    await user.click(
      screen.getByRole("button", { name: "Open votes from 21 voters" })
    );
    expect(mockUseDropVoteLogs).toHaveBeenLastCalledWith({
      dropId: "drop-1",
      enabled: false,
    });

    await user.click(screen.getByRole("tab", { name: "Vote log" }));

    expect(mockUseDropVoteLogs).toHaveBeenLastCalledWith({
      dropId: "drop-1",
      enabled: true,
    });
  });

  it("shows an error state and retries voters", async () => {
    const user = userEvent.setup();
    const refetch = jest.fn();
    mockUseDropVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
      isError: true,
      refetch,
    });

    render(<ParticipationDropVoteDetailsTrigger drop={drop} />);

    await user.click(
      screen.getByRole("button", { name: "Open votes from 21 voters" })
    );

    expect(screen.getByText("Could not load voters.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });
});
