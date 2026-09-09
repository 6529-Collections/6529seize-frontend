import { publicEnvSchema } from "@/config/env.schema";

const originalEthereumRpcUrl = process.env["ETHEREUM_RPC_URL"];

describe("Ethereum RPC server configuration", () => {
  afterEach(() => {
    jest.resetModules();
    if (originalEthereumRpcUrl === undefined) {
      delete process.env["ETHEREUM_RPC_URL"];
    } else {
      process.env["ETHEREUM_RPC_URL"] = originalEthereumRpcUrl;
    }
  });

  it("accepts an HTTPS RPC URL", () => {
    process.env["ETHEREUM_RPC_URL"] = "https://eth-mainnet.example.test/v2/key";

    const { getEthereumRpcUrl } = require("@/config/ethereumRpcEnv") as {
      getEthereumRpcUrl: () => string;
    };

    expect(getEthereumRpcUrl()).toBe("https://eth-mainnet.example.test/v2/key");
  });

  it("rejects a missing RPC URL", () => {
    delete process.env["ETHEREUM_RPC_URL"];

    const { getEthereumRpcUrl } = require("@/config/ethereumRpcEnv") as {
      getEthereumRpcUrl: () => string;
    };

    expect(() => getEthereumRpcUrl()).toThrow();
  });

  it("rejects non-HTTP RPC URLs", () => {
    process.env["ETHEREUM_RPC_URL"] = "ws://eth-mainnet.example.test";

    const { getEthereumRpcUrl } = require("@/config/ethereumRpcEnv") as {
      getEthereumRpcUrl: () => string;
    };

    expect(() => getEthereumRpcUrl()).toThrow(
      "ETHEREUM_RPC_URL must use HTTP or HTTPS"
    );
  });

  it("does not include the RPC URL in public runtime configuration", () => {
    const parsed = publicEnvSchema.parse({
      ALLOWLIST_API_ENDPOINT: "https://allowlist.example.test",
      API_ENDPOINT: "https://api.example.test",
      BASE_ENDPOINT: "https://6529.io",
      ETHEREUM_RPC_URL: "https://eth-mainnet.example.test/v2/private-key",
      IPFS_API_ENDPOINT: "https://ipfs-api.example.test",
      IPFS_GATEWAY_ENDPOINT: "https://ipfs.example.test",
    });

    expect(parsed).not.toHaveProperty("ETHEREUM_RPC_URL");
    expect(JSON.stringify(parsed)).not.toContain("eth-mainnet.example.test");
  });
});
