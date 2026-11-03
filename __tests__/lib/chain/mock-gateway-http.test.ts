/**
 * @jest-environment node
 */
import { spawn } from "node:child_process";
import path from "node:path";

import { createGatewayClient } from "@/lib/chain/gateway/client";
import { createHttpGatewayTransport } from "@/lib/chain/gateway/http-transport";
import { parseTxLocation } from "@/lib/chain/gateway/wire";
import { startMockGatewayServer, type MockGatewayServer } from "@/lib/chain/mock/http-server";

import { signedVote } from "./fixtures/signed-tx";

jest.setTimeout(60_000);

describe("mock chain gateway over HTTP (wire v0)", () => {
  let server: MockGatewayServer;

  beforeAll(async () => {
    server = await startMockGatewayServer();
  });

  afterAll(async () => {
    await server.close();
  });

  const transports = () =>
    server.gateways.map((gateway) =>
      createHttpGatewayTransport({
        ref: { id: gateway.id, operator: gateway.operator },
        baseUrl: gateway.url,
      })
    );

  const produceBlock = async (): Promise<void> => {
    const response = await fetch(`${server.url}/_mock/block`, { method: "POST" });
    expect(response.status).toBe(200);
  };

  it("sends identical bytes to two operators and reports Committed (reported by 2)", async () => {
    const client = createGatewayClient({ gateways: transports(), sleep: produceBlock });
    const { bytes, txId } = await signedVote();
    const statuses: string[] = [];
    const final = await client.track(bytes, {
      onStatus: (status) => statuses.push(`${status.label}:${status.reportedBy}`),
    });
    expect(client.primary.map((g) => g.id)).toEqual(["a", "b", "c"]);
    expect(statuses).toEqual(["signed:0", "submitted:3", "committed:3"]);
    expect(final).toMatchObject({ txId, label: "committed", verified: false });
    const location = parseTxLocation(await (await fetch(`${server.gateways[0]?.url ?? ""}v0/tx/${txId}`)).json());
    expect(location.status).toBe("included");
  });

  it("returns CheckTx codes for refused bytes and oversize bodies", async () => {
    const [first] = transports();
    expect(await first?.submit(Uint8Array.of(0x40, 0x01))).toEqual({ code: 0x0101, detail: 0 });
    expect(await first?.submit(new Uint8Array(16 * 1024 + 1))).toEqual({ code: 0x0103, detail: 0 });
  });

  it("drops the connection for a silent gateway and answers CORS for loopback only", async () => {
    const behavior = await fetch(`${server.url}/_mock/behavior`, {
      method: "POST",
      body: JSON.stringify({ gateway: "c", behavior: "silent" }),
    });
    expect(behavior.status).toBe(200);
    await expect(fetch(`${server.url}/g/c/v0/head`)).rejects.toThrow();
    const local = await fetch(`${server.url}/g/a/v0/head`, {
      headers: { origin: "http://localhost:3001" },
    });
    expect(local.headers.get("access-control-allow-origin")).toBe("http://localhost:3001");
    const remote = await fetch(`${server.url}/g/a/v0/head`, {
      headers: { origin: "https://example.com" },
    });
    expect(remote.headers.get("access-control-allow-origin")).toBeNull();
    expect((await fetch(`${server.url}/g/zz/v0/head`)).status).toBe(404);
  });
});

describe("mock gateway binding", () => {
  it("refuses to bind a non-loopback interface", async () => {
    await expect(startMockGatewayServer({ host: "0.0.0.0" })).rejects.toThrow(RangeError);
  });
});

describe("scripts/mock-chain-gateway.cjs", () => {
  it("starts, prints its ready line and serves the control API", async () => {
    const script = path.join(process.cwd(), "scripts", "mock-chain-gateway.cjs");
    const child = spawn(process.execPath, [script, "--port", "0", "--gateways", "x:op-x,y:op-y"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    try {
      const ready = await new Promise<{ url: string; gateways: { id: string }[] }>((resolve, reject) => {
        let buffer = "";
        let errors = "";
        child.stdout.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const line = buffer.split("\n")[0];
          if (buffer.includes("\n") && line !== undefined) {
            resolve(JSON.parse(line) as { url: string; gateways: { id: string }[] });
          }
        });
        child.stderr.on("data", (chunk: Buffer) => {
          errors += chunk.toString("utf8");
        });
        child.once("exit", (code) => reject(new Error(`exited with ${String(code)}: ${errors}`)));
      });
      expect(ready.gateways.map((g) => g.id)).toEqual(["x", "y"]);
      const state = (await (await fetch(`${ready.url}/_mock/state`)).json()) as {
        gateways: string[];
        head: { height: string };
      };
      expect(state).toMatchObject({ gateways: ["x", "y"], head: { height: "0" } });
    } finally {
      child.kill();
    }
    // Startup compiles the TypeScript mock through tsx, slow on a loaded runner.
  }, 180_000);
});
