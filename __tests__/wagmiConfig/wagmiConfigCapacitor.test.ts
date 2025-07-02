import { wagmiConfigCapacitor } from "@/wagmiConfig/wagmiConfigCapacitor";
import { mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import { walletConnect, coinbaseWallet, injected } from "wagmi/connectors";

jest.mock("wagmi", () => ({ createConfig: jest.fn(() => ({})) }));
jest.mock("wagmi/connectors", () => ({
  walletConnect: jest.fn(() => "wc"),
  coinbaseWallet: jest.fn(() => "cb"),
  injected: jest.fn(() => "inj"),
}));

const mockCreateConfig = createConfig as jest.Mock;

describe("wagmiConfigCapacitor", () => {
  it("builds config with connectors", () => {
    const metadata = { name: "test" };
    wagmiConfigCapacitor([mainnet], metadata);
    expect(walletConnect).toHaveBeenCalledWith({
      projectId: "0ba285cc179045bec37f7c9b9e7f9fbf",
      metadata,
      showQrModal: false,
    });
    expect(coinbaseWallet).toHaveBeenCalled();
    expect(injected).toHaveBeenCalled();
    expect(mockCreateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ connectors: ["wc", "cb", "inj"] })
    );
  });
});
