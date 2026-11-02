import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import WaveJoinCta from "@/components/waves/header/WaveJoinCta";
import {
  getWaveJoinCtaState,
  JOIN_CONFIRMATION_MS,
} from "@/helpers/waves/wave-join.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";

type MockAuth = {
  connectedProfile: { handle: string } | null;
  activeProfileProxy: { id: string } | null;
};

type MockConnect = {
  connectionState: "initializing" | "disconnected" | "connected";
  hasActiveWalletAddress: boolean;
  seizeConnect: jest.Mock;
  seizeConnectOpen: boolean;
};

type MockJoin = {
  isJoined: boolean;
  isPending: boolean;
  join: jest.Mock<Promise<boolean>, []>;
};

let mockAuth: MockAuth;
let mockConnect: MockConnect;
let mockJoin: MockJoin;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnect,
}));

jest.mock("@/hooks/waves/useWaveJoin", () => ({
  useWaveJoin: () => mockJoin,
}));

const createWave = (isDirectMessage = false) =>
  ({
    id: "wave-1",
    name: "Follow The Repo",
    subscribed_actions: [],
    chat: { scope: { group: { is_direct_message: isDirectMessage } } },
  }) as unknown as ApiWave;

const getJoinButton = () =>
  screen.getByRole("button", { name: "Join Follow The Repo" });

describe("getWaveJoinCtaState", () => {
  const signedIn = {
    isDirectMessage: false,
    hasProfileHandle: true,
    isProxy: false,
    isSignedOut: false,
    isJoined: false,
    joinedHere: false,
  };

  it.each([
    ["a signed-in non-member", signedIn, "join"],
    ["a member", { ...signedIn, isJoined: true }, "hidden"],
    [
      "a member who just joined here",
      { ...signedIn, isJoined: true, joinedHere: true },
      "joined",
    ],
    ["a direct message", { ...signedIn, isDirectMessage: true }, "hidden"],
    ["a proxy session", { ...signedIn, isProxy: true }, "hidden"],
    [
      "a signed-out visitor",
      { ...signedIn, hasProfileHandle: false, isSignedOut: true },
      "sign-in",
    ],
    [
      "a signed-out visitor on a direct message",
      {
        ...signedIn,
        hasProfileHandle: false,
        isSignedOut: true,
        isDirectMessage: true,
      },
      "hidden",
    ],
    [
      "a wallet whose profile has not resolved",
      { ...signedIn, hasProfileHandle: false },
      "hidden",
    ],
  ] as const)("returns the right state for %s", (_label, input, expected) => {
    expect(getWaveJoinCtaState(input)).toBe(expected);
  });
});

describe("WaveJoinCta", () => {
  beforeEach(() => {
    mockAuth = {
      connectedProfile: { handle: "alice" },
      activeProfileProxy: null,
    };
    mockConnect = {
      connectionState: "connected",
      hasActiveWalletAddress: true,
      seizeConnect: jest.fn(),
      seizeConnectOpen: false,
    };
    mockJoin = {
      isJoined: false,
      isPending: false,
      join: jest.fn(async () => {
        mockJoin.isJoined = true;
        return true;
      }),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("offers a labelled primary Join to signed-in non-members", () => {
    render(<WaveJoinCta wave={createWave()} tooltipId="header-actions" />);

    const button = getJoinButton();
    expect(button).toHaveTextContent("Join");
    expect(button).toHaveClass("tw-h-8");
    expect(button).toHaveAttribute("data-tooltip-id", "header-actions");
    expect(button).toHaveAttribute(
      "data-tooltip-content",
      "Add this wave to your Joined list"
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("uses the taller native header size without hover tooltips", () => {
    render(<WaveJoinCta wave={createWave()} variant="app-header" />);

    const button = getJoinButton();
    expect(button).toHaveClass("tw-h-9");
    expect(button).not.toHaveAttribute("data-tooltip-id");
  });

  it.each([
    [
      "members",
      () => {
        mockJoin.isJoined = true;
      },
      false,
    ],
    ["direct messages", () => {}, true],
    [
      "proxy sessions",
      () => {
        mockAuth.activeProfileProxy = { id: "proxy" };
      },
      false,
    ],
    [
      "wallets whose profile is still loading",
      () => {
        mockAuth.connectedProfile = null;
      },
      false,
    ],
    [
      "sessions that are still initializing",
      () => {
        mockAuth.connectedProfile = null;
        mockConnect.connectionState = "initializing";
        mockConnect.hasActiveWalletAddress = false;
      },
      false,
    ],
  ])("renders nothing for %s", (_label, arrange, isDirectMessage) => {
    arrange();
    const { container } = render(
      <WaveJoinCta wave={createWave(isDirectMessage)} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("sends signed-out visitors into the connect flow instead of joining", () => {
    mockAuth.connectedProfile = null;
    mockConnect.connectionState = "disconnected";
    mockConnect.hasActiveWalletAddress = false;
    render(<WaveJoinCta wave={createWave()} tooltipId="header-actions" />);

    const button = getJoinButton();
    expect(button).toHaveAttribute(
      "data-tooltip-content",
      "Connect a wallet to join this wave"
    );
    fireEvent.click(button);

    expect(mockConnect.seizeConnect).toHaveBeenCalledTimes(1);
    expect(mockJoin.join).not.toHaveBeenCalled();
  });

  it("marks the signed-out Join busy while the connect dialog is open", () => {
    mockAuth.connectedProfile = null;
    mockConnect.connectionState = "disconnected";
    mockConnect.hasActiveWalletAddress = false;
    mockConnect.seizeConnectOpen = true;
    render(<WaveJoinCta wave={createWave()} />);

    const button = getJoinButton();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("shows progress while the join request runs", () => {
    mockJoin.isPending = true;
    render(<WaveJoinCta wave={createWave()} />);

    const button = getJoinButton();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("confirms a keyboard join in place, announces it, and keeps focus", async () => {
    jest.useFakeTimers();
    render(<WaveJoinCta wave={createWave()} />);
    const button = getJoinButton();
    button.focus();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockJoin.join).toHaveBeenCalledTimes(1);
    const confirmation = screen.getByTestId("wave-join-confirmation");
    expect(confirmation).toHaveTextContent("Joined");
    expect(confirmation).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(
      "You joined Follow The Repo."
    );

    // A focused confirmation never disappears underneath the keyboard user.
    act(() => {
      jest.advanceTimersByTime(JOIN_CONFIRMATION_MS);
    });
    expect(screen.getByTestId("wave-join-confirmation")).toHaveFocus();

    act(() => {
      confirmation.blur();
    });
    expect(screen.queryByTestId("wave-join-confirmation")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Join/ })).toBeNull();
  });

  it("settles into the member header after a pointer join", async () => {
    jest.useFakeTimers();
    render(
      <>
        <button type="button">Elsewhere</button>
        <WaveJoinCta wave={createWave()} />
      </>
    );
    screen.getByRole("button", { name: "Elsewhere" }).focus();

    await act(async () => {
      fireEvent.click(getJoinButton());
    });

    const confirmation = screen.getByTestId("wave-join-confirmation");
    expect(confirmation).not.toHaveFocus();
    expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();

    act(() => {
      jest.advanceTimersByTime(JOIN_CONFIRMATION_MS - 1);
    });
    expect(screen.getByTestId("wave-join-confirmation")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("wave-join-confirmation")).toBeNull();
  });

  it("lets a tapped confirmation settle even though the tap focused Join", async () => {
    jest.useFakeTimers();
    render(<WaveJoinCta wave={createWave()} />);
    const button = getJoinButton();
    button.focus();
    // Touch and mouse activation focus the button without focus-visible.
    const matches = jest
      .spyOn(button, "matches")
      .mockImplementation((selector) => selector !== ":focus-visible");

    await act(async () => {
      fireEvent.click(button);
    });
    matches.mockRestore();

    const confirmation = screen.getByTestId("wave-join-confirmation");
    expect(confirmation).not.toHaveFocus();
    act(() => {
      jest.advanceTimersByTime(JOIN_CONFIRMATION_MS);
    });
    expect(screen.queryByTestId("wave-join-confirmation")).toBeNull();
  });

  it("keeps Join available and focused when joining fails", async () => {
    mockJoin.join.mockImplementation(async () => false);
    render(<WaveJoinCta wave={createWave()} />);
    const button = getJoinButton();
    button.focus();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(getJoinButton()).toHaveFocus();
    expect(screen.queryByTestId("wave-join-confirmation")).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("renders nothing on the server, before the session is known", () => {
    expect(renderToString(<WaveJoinCta wave={createWave()} />)).toBe("");
  });
});
