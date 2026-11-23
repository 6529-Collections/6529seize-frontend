import { blockedRpcResponseBody } from "../../tests/support/blockedRpcResponse";

const error = {
  code: -32603,
  message: "Blocked by the local E2E sandbox",
};

describe("blocked WalletConnect RPC response", () => {
  it("answers a single call with an error that keeps its id", () => {
    expect(
      blockedRpcResponseBody(
        JSON.stringify({ jsonrpc: "2.0", id: 7, method: "eth_chainId" })
      )
    ).toEqual({ jsonrpc: "2.0", id: 7, error });
  });

  it("answers every call in a batch", () => {
    expect(
      blockedRpcResponseBody(
        JSON.stringify([
          { jsonrpc: "2.0", id: 1, method: "eth_blockNumber" },
          { jsonrpc: "2.0", id: "two", method: "eth_call" },
        ])
      )
    ).toEqual([
      { jsonrpc: "2.0", id: 1, error },
      { jsonrpc: "2.0", id: "two", error },
    ]);
  });

  it("falls back to a null id for empty or malformed bodies", () => {
    for (const body of [null, "", "not json", "42"]) {
      expect(blockedRpcResponseBody(body)).toEqual({
        jsonrpc: "2.0",
        id: null,
        error,
      });
    }
  });
});
