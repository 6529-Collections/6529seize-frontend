import { render, screen } from "@testing-library/react";
import UserPageSetUpProfileWrapper from "@/components/user/utils/set-up-profile/UserPageSetUpProfileWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";

let mockHasHydrated = true;
jest.mock("@/hooks/useHasHydrated", () => ({
  useHasHydrated: () => mockHasHydrated,
}));

jest.mock(
  "@/components/user/utils/set-up-profile/UserPageSetUpProfile",
  () => ({
    __esModule: true,
    default: () => <div data-testid="setup" />,
  })
);

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const {
  useSeizeConnectContext,
} = require("@/components/auth/SeizeConnectContext");

describe("UserPageSetUpProfileWrapper", () => {
  beforeEach(() => {
    mockHasHydrated = true;
  });
  const baseProfile: ApiIdentity = {
    id: "1",
    handle: null,
    normalised_handle: null,
    pfp: null,
    cic: 0,
    rep: 0,
    level: 0,
    tdh: 0,
    consolidation_key: "",
    display: "",
    primary_wallet: "",
    banner1: null,
    banner2: null,
    classification: ApiProfileClassification.Bot,
    sub_classification: null,
    wallets: [{ wallet: "0xabc", display: "0xabc", tdh: 0 }],
  } as any;

  it("shows setup component when connected wallet matches and handle missing", () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0xabc" });
    render(
      <UserPageSetUpProfileWrapper profile={baseProfile}>
        <div data-testid="child" />
      </UserPageSetUpProfileWrapper>
    );
    expect(screen.getByTestId("setup")).toBeInTheDocument();
  });

  it("shows children when no wallet match", () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0xdef" });
    render(
      <UserPageSetUpProfileWrapper profile={baseProfile}>
        <div data-testid="child" />
      </UserPageSetUpProfileWrapper>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("keeps the initial server view until the wallet state has hydrated", () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0xabc" });
    mockHasHydrated = false;
    const view = (
      <UserPageSetUpProfileWrapper profile={baseProfile}>
        <div data-testid="child" />
      </UserPageSetUpProfileWrapper>
    );
    const { rerender } = render(view);
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryByTestId("setup")).not.toBeInTheDocument();

    mockHasHydrated = true;
    rerender(
      <UserPageSetUpProfileWrapper profile={baseProfile}>
        <div data-testid="child" />
      </UserPageSetUpProfileWrapper>
    );
    expect(screen.getByTestId("setup")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("returns to profile content when a handle is saved", () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0xabc" });
    const { rerender } = render(
      <UserPageSetUpProfileWrapper profile={baseProfile}>
        <div data-testid="child" />
      </UserPageSetUpProfileWrapper>
    );
    expect(screen.getByTestId("setup")).toBeInTheDocument();
    rerender(
      <UserPageSetUpProfileWrapper
        profile={{ ...baseProfile, handle: "alice" }}
      >
        <div data-testid="child" />
      </UserPageSetUpProfileWrapper>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryByTestId("setup")).not.toBeInTheDocument();
  });
});
