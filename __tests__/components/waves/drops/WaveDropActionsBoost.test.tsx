import { useAuth } from "@/components/auth/Auth";
import WaveDropActionsBoost from "@/components/waves/drops/WaveDropActionsBoost";
import WaveDropMobileMenuBoost from "@/components/waves/drops/WaveDropMobileMenuBoost";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/drops/useDropBoostMutation", () => ({
  useDropBoostMutation: () => ({
    toggleBoost: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children }: any) => <div>{children}</div>,
    span: ({ children }: any) => <span>{children}</span>,
  },
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
}));

const useAuthMock = useAuth as jest.Mock;

const createDrop = ({
  authorId = "author-id",
  authorHandle = "alice",
  authenticatedUserAdmin = false,
  waveAuthorHandle = "creator",
}: {
  readonly authorId?: string;
  readonly authorHandle?: string;
  readonly authenticatedUserAdmin?: boolean;
  readonly waveAuthorHandle?: string | null;
} = {}) =>
  ({
    id: "drop-1",
    type: "FULL",
    stableKey: "drop-1",
    stableHash: "drop-1",
    author: {
      id: authorId,
      handle: authorHandle,
    },
    wave: {
      id: "wave-1",
      authenticated_user_admin: authenticatedUserAdmin,
      wave_author_handle: waveAuthorHandle,
    },
    context_profile_context: {
      boosted: false,
    },
    boosts: 0,
  }) as any;

describe("WaveDropActionsBoost", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      connectedProfile: { id: "author-id", handle: "alice" },
    });
  });

  it("hides the desktop boost button on own drops for non-admin non-creators", () => {
    render(
      <WaveDropActionsBoost drop={createDrop({ waveAuthorHandle: "bob" })} />
    );

    expect(
      screen.queryByRole("button", { name: "Boost drop" })
    ).not.toBeInTheDocument();
  });

  it("shows the desktop boost button on own drops for wave admins", () => {
    render(
      <WaveDropActionsBoost
        drop={createDrop({
          authenticatedUserAdmin: true,
          waveAuthorHandle: "bob",
        })}
      />
    );

    expect(screen.getByRole("button", { name: "Boost drop" })).toBeVisible();
  });

  it("shows the desktop boost button on own drops for wave creators", () => {
    render(
      <WaveDropActionsBoost drop={createDrop({ waveAuthorHandle: "alice" })} />
    );

    expect(screen.getByRole("button", { name: "Boost drop" })).toBeVisible();
  });

  it("shows the desktop boost button on drops from other authors", () => {
    useAuthMock.mockReturnValue({
      connectedProfile: { id: "viewer-id", handle: "bob" },
    });

    render(<WaveDropActionsBoost drop={createDrop()} />);

    expect(screen.getByRole("button", { name: "Boost drop" })).toBeVisible();
  });
});

describe("WaveDropMobileMenuBoost", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      connectedProfile: { id: "author-id", handle: "alice" },
    });
  });

  it("hides the mobile boost button on own drops for non-admin non-creators", () => {
    render(
      <WaveDropMobileMenuBoost
        drop={createDrop({ waveAuthorHandle: "bob" })}
        onBoostChange={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Boost" })
    ).not.toBeInTheDocument();
  });

  it("shows the mobile boost button on own drops for wave creators", () => {
    render(
      <WaveDropMobileMenuBoost
        drop={createDrop({ waveAuthorHandle: "alice" })}
        onBoostChange={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Boost" })).toBeVisible();
  });
});
