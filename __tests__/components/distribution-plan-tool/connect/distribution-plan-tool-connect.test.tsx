import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DistributionPlanToolConnect from "@/components/distribution-plan-tool/connect/distribution-plan-tool-connect";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAuth } from "@/components/auth/Auth";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const address = "0x1111111111111111111111111111111111111111";
const mockConnect = jest.fn();
const mockRequestAuth = jest.fn();
const setConnection = (overrides = {}) => {
  jest.mocked(useSeizeConnectContext).mockReturnValue({
    connectionState: "disconnected",
    hasValidWalletAuth: false,
    address: undefined,
    seizeConnect: mockConnect,
    isWalletConnectionPending: false,
    ...overrides,
  } as ReturnType<typeof useSeizeConnectContext>);
};

beforeEach(() => {
  jest.clearAllMocks();
  setConnection();
  jest
    .mocked(useAuth)
    .mockReturnValue({ requestAuth: mockRequestAuth } as ReturnType<
      typeof useAuth
    >);
  mockRequestAuth.mockResolvedValue({ success: false });
});

it("shows compact guidance, a connect action and public help while signed out", async () => {
  render(<DistributionPlanToolConnect />);
  expect(
    screen.getByRole("heading", { name: "Connect Your Wallet" })
  ).toBeVisible();
  expect(screen.getByText(/No gas is needed/)).toBeVisible();
  expect(screen.queryByText(/Meet EMMA/)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "About EMMA" })).toHaveAttribute(
    "href",
    "/emma/help"
  );
  await userEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
  expect(mockConnect).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
});

it.each(["initializing", "connecting"])(
  "waits during %s without flashing the form",
  (connectionState) => {
    setConnection({ connectionState });
    render(<DistributionPlanToolConnect />);
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  }
);

it("waits for an unsigned wallet reconnection", () => {
  setConnection({
    address,
    connectionState: "connected",
    isWalletConnectionPending: true,
  });
  render(<DistributionPlanToolConnect />);
  expect(screen.getByRole("status")).toBeVisible();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("sends a restored authenticated session directly to plans without a live signer", () => {
  setConnection({
    address,
    connectionState: "connected",
    hasValidWalletAuth: true,
    isConnected: false,
    isWalletConnectionPending: true,
  });
  render(<DistributionPlanToolConnect />);
  expect(mockReplace).toHaveBeenCalledWith("/emma/plans");
  expect(mockRequestAuth).not.toHaveBeenCalled();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("does not treat a connected wallet as an authenticated session", () => {
  setConnection({ address, connectionState: "connected", isConnected: true });
  render(<DistributionPlanToolConnect />);
  expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("continues to the requested plan after sign-in", async () => {
  setConnection({ address, connectionState: "connected" });
  mockRequestAuth.mockResolvedValue({ success: true });
  render(<DistributionPlanToolConnect returnTo="/emma/plans/plan-123" />);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(mockRequestAuth).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith("/emma/plans/plan-123");
});

it("stays on the form when sign-in is canceled and allows retry", async () => {
  setConnection({ address, connectionState: "connected" });
  render(<DistributionPlanToolConnect />);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(mockReplace).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
});

it("disables repeated sign-in requests while one is pending", async () => {
  setConnection({ address, connectionState: "connected" });
  let finish: (result: { success: boolean }) => void = () => undefined;
  mockRequestAuth.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  render(<DistributionPlanToolConnect />);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(screen.getByRole("button")).toBeDisabled();
  await act(async () => {
    finish({ success: false });
  });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled()
  );
});

it("redirects when the session becomes authenticated through the global wallet flow", () => {
  const { rerender } = render(
    <DistributionPlanToolConnect returnTo="/emma/plans/plan-123" />
  );
  setConnection({
    address,
    hasValidWalletAuth: true,
    connectionState: "connected",
  });
  rerender(<DistributionPlanToolConnect returnTo="/emma/plans/plan-123" />);
  expect(mockReplace).toHaveBeenCalledWith("/emma/plans/plan-123");
});
