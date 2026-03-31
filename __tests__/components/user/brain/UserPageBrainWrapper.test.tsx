import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import UserPageBrainWrapper from "@/components/user/brain/UserPageBrainWrapper";
import { useIdentity } from "@/hooks/useIdentity";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("@/components/user/brain/UserPageDrops", () => (props: any) => (
  <div data-testid="drops">{props.profile?.id ?? "none"}</div>
));

const useParams = require("next/navigation").useParams;
(useParams as jest.Mock).mockReturnValue({
  user: "alice",
});

function renderWithContext(ctx: any) {
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: ctx.address,
    connectionState: ctx.connectionState ?? "disconnected",
  });
  const AuthCtx = require("@/components/auth/Auth").AuthContext;
  (useIdentity as jest.Mock).mockReturnValue({
    profile: "hydratedIdentity" in ctx ? ctx.hydratedIdentity : ctx.identity,
  });
  return render(
    <AuthCtx.Provider value={ctx.auth as any}>
      <UserPageBrainWrapper profile={ctx.identity} />
    </AuthCtx.Provider>
  );
}

describe("UserPageBrainWrapper", () => {
  it("renders a placeholder when brain stays unavailable", () => {
    const { container } = renderWithContext({
      address: "0x1",
      connectionState: "connected",
      auth: {
        connectedProfile: null,
        fetchingProfile: false,
        showWaves: false,
      },
      identity: { id: "1" },
    });

    expect(screen.queryByTestId("drops")).not.toBeInTheDocument();
    expect(container.querySelector(".tw-min-h-screen")).toBeInTheDocument();
  });

  it("shows drops when waves enabled", () => {
    renderWithContext({
      address: "0x1",
      connectionState: "connected",
      auth: {
        connectedProfile: null,
        fetchingProfile: false,
        showWaves: true,
      },
      identity: { id: "1" },
    });

    expect(screen.getByTestId("drops")).toBeInTheDocument();
    expect(screen.getByTestId("drops")).toHaveTextContent("1");
  });

  it("keeps the placeholder while hydration is still pending", () => {
    const { container } = renderWithContext({
      address: undefined,
      connectionState: "initializing",
      auth: {
        connectedProfile: null,
        fetchingProfile: false,
        showWaves: false,
      },
      identity: { id: "1" },
      hydratedIdentity: null,
    });

    expect(screen.queryByTestId("drops")).not.toBeInTheDocument();
    expect(container.querySelector(".tw-min-h-screen")).toBeInTheDocument();
  });

  it("falls back to the server profile when waves are available", () => {
    renderWithContext({
      address: "0x1",
      connectionState: "connected",
      auth: {
        connectedProfile: null,
        fetchingProfile: false,
        showWaves: true,
      },
      identity: { id: "server-profile" },
      hydratedIdentity: null,
    });

    expect(screen.getByTestId("drops")).toHaveTextContent("server-profile");
  });
});
