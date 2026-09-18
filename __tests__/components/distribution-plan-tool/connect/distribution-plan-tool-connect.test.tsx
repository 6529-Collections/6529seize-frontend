import { render, screen, act } from "@testing-library/react";
import DistributionPlanToolConnect from "@/components/distribution-plan-tool/connect/distribution-plan-tool-connect";

jest.mock(
  "@/components/distribution-plan-tool/connect/distribution-plan-tool-not-connected",
  () => () => <div data-testid="not-connected" />
);
jest.mock(
  "@/components/distribution-plan-tool/connect/distribution-plan-tool-connected",
  () => () => <div data-testid="connected" />
);
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import * as helpers from "@/helpers/AllowlistToolHelpers";

describe("DistributionPlanToolConnect", () => {
  it("renders not connected view when address invalid", async () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: null });
    jest.spyOn(helpers, "isEthereumAddress").mockReturnValue(false);
    await act(async () => {
      render(<DistributionPlanToolConnect />);
    });
    expect(screen.getByTestId("not-connected")).toBeInTheDocument();
  });

  it("renders connected view when address valid", async () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0x1" });
    jest.spyOn(helpers, "isEthereumAddress").mockReturnValue(true);
    await act(async () => {
      render(<DistributionPlanToolConnect />);
    });
    expect(screen.getByTestId("connected")).toBeInTheDocument();
  });
});

it.each(["initializing", "connecting"])(
  "keeps EMMA neutral during %s and resolves directly to the wallet",
  (connectionState) => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ connectionState });
    const { rerender } = render(<DistributionPlanToolConnect />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByTestId("not-connected")).not.toBeInTheDocument();
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      connectionState: "connected",
      address: "0x1",
    });
    jest.spyOn(helpers, "isEthereumAddress").mockReturnValue(true);
    rerender(<DistributionPlanToolConnect />);
    expect(screen.getByTestId("connected")).toBeInTheDocument();
    expect(screen.queryByTestId("not-connected")).not.toBeInTheDocument();
  }
);

it.each([
  { restored: true, expectedView: "connected" },
  { restored: false, expectedView: "not-connected" },
])(
  "keeps EMMA signing hidden until wallet reconnection settles ($expectedView)",
  ({ restored, expectedView }) => {
    const address = "0x1111111111111111111111111111111111111111";
    jest
      .spyOn(helpers, "isEthereumAddress")
      .mockImplementation((value) => value === address);
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address,
      connectionState: "connected",
      isConnected: false,
      isWalletConnectionPending: true,
    });
    const { rerender } = render(<DistributionPlanToolConnect />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByTestId("connected")).not.toBeInTheDocument();
    expect(screen.queryByTestId("not-connected")).not.toBeInTheDocument();

    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: restored ? address : undefined,
      connectionState: restored ? "connected" : "disconnected",
      isConnected: restored,
      isWalletConnectionPending: false,
    });
    rerender(<DistributionPlanToolConnect />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByTestId(expectedView)).toBeInTheDocument();
  }
);
