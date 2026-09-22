import { render, screen } from "@testing-library/react";
import EmmaAuthGate from "@/components/distribution-plan-tool/EmmaAuthGate";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getEmmaReturnPath } from "@/components/distribution-plan-tool/emma-route";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock("next/navigation", () => ({
  usePathname: () => "/emma/plans/plan-123",
  useRouter: () => mockRouter,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it.each(["initializing", "connecting", "disconnected", "connected"])(
  "keeps plan content unmounted without auth in the %s state",
  (connectionState) => {
    jest.mocked(useSeizeConnectContext).mockReturnValue({
      connectionState,
      hasValidWalletAuth: false,
    } as ReturnType<typeof useSeizeConnectContext>);
    const mounted = jest.fn();
    function Plan() {
      mounted();
      return <div>Private plan</div>;
    }
    render(
      <EmmaAuthGate>
        <Plan />
      </EmmaAuthGate>
    );
    expect(mounted).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Loading account");
    if (
      connectionState === "initializing" ||
      connectionState === "connecting"
    ) {
      expect(mockReplace).not.toHaveBeenCalled();
    } else {
      expect(mockReplace).toHaveBeenCalledWith(
        "/emma?returnTo=%2Femma%2Fplans%2Fplan-123"
      );
    }
  }
);

it("allows a restored session without a connected signing wallet and hides content on logout", () => {
  jest.mocked(useSeizeConnectContext).mockReturnValue({
    hasValidWalletAuth: true,
    connectionState: "connected",
    isConnected: false,
    isWalletConnectionPending: true,
  } as ReturnType<typeof useSeizeConnectContext>);
  const { rerender } = render(
    <EmmaAuthGate>
      <div>Private plan</div>
    </EmmaAuthGate>
  );
  expect(screen.getByText("Private plan")).toBeVisible();
  expect(mockReplace).not.toHaveBeenCalled();
  jest.mocked(useSeizeConnectContext).mockReturnValue({
    hasValidWalletAuth: false,
    connectionState: "disconnected",
  } as ReturnType<typeof useSeizeConnectContext>);
  rerender(
    <EmmaAuthGate>
      <div>Private plan</div>
    </EmmaAuthGate>
  );
  expect(screen.queryByText("Private plan")).not.toBeInTheDocument();
  expect(mockReplace).toHaveBeenCalledWith(
    "/emma?returnTo=%2Femma%2Fplans%2Fplan-123"
  );
});

it.each([
  undefined,
  ["/emma/plans/a"],
  "//evil.example",
  "https://evil.example",
  "javascript:alert(1)",
  "/emma/help",
  "/emma/plans/../help",
  "/emma/plans/%2f%2fevil.example",
  "/emma/plans/a\\b",
  "/emma/plans/a/other",
  "/emma/plans/a?redirect=https://evil.example",
  "/emma/plans/a#fragment",
])("rejects unsafe or unrelated return destinations: %s", (value) => {
  expect(getEmmaReturnPath(value)).toBe("/emma/plans");
});

it.each([
  "/emma/plans",
  "/emma/plans/plan-123",
  "/emma/plans/a_b",
  "/emma/plans/00000000-0000-4000-8000-000000000529",
])("preserves plan destination %s", (value) => {
  expect(getEmmaReturnPath(value)).toBe(value);
});

it("settles from loading to unsigned to authenticated without repeating the redirect", () => {
  const connection = {
    connectionState: "initializing",
    hasValidWalletAuth: false,
  } as ReturnType<typeof useSeizeConnectContext>;
  jest.mocked(useSeizeConnectContext).mockImplementation(() => connection);
  const content = (
    <EmmaAuthGate>
      <div>Private plan</div>
    </EmmaAuthGate>
  );
  const { rerender } = render(content);
  expect(mockReplace).not.toHaveBeenCalled();
  connection.connectionState = "connecting";
  rerender(
    <EmmaAuthGate>
      <div>Private plan</div>
    </EmmaAuthGate>
  );
  expect(mockReplace).not.toHaveBeenCalled();
  connection.connectionState = "connected";
  rerender(
    <EmmaAuthGate>
      <div>Private plan</div>
    </EmmaAuthGate>
  );
  expect(mockReplace).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenLastCalledWith(
    "/emma?returnTo=%2Femma%2Fplans%2Fplan-123"
  );
  rerender(
    <EmmaAuthGate>
      <div>Private plan</div>
    </EmmaAuthGate>
  );
  expect(mockReplace).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Private plan")).not.toBeInTheDocument();
  connection.hasValidWalletAuth = true;
  rerender(
    <EmmaAuthGate>
      <div>Private plan</div>
    </EmmaAuthGate>
  );
  expect(screen.getByText("Private plan")).toBeVisible();
  expect(mockReplace).toHaveBeenCalledTimes(1);
});
