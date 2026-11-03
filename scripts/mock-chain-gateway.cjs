#!/usr/bin/env node
/**
 * Runs the deterministic mock chain gateway (lib/chain/mock) over HTTP.
 *
 *   node scripts/mock-chain-gateway.cjs [--port 0] [--host 127.0.0.1]
 *     [--gateways a:operator-a,b:operator-b,c:operator-c]
 *     [--block-interval-ms 0]
 *
 * Prints one JSON line on stdout when ready:
 *   {"ready":true,"url":"http://127.0.0.1:PORT","gateways":[{id,operator,url}]}
 * and stops on SIGINT or SIGTERM. With --block-interval-ms 0 (the default)
 * blocks are produced only by `POST /_mock/block`, so runs are
 * deterministic. Network: P28 appendix A's example devnet (test data).
 */
"use strict";

require("tsx/cjs/api").register();

const { startMockGatewayServer } = require("../lib/chain/mock/http-server.ts");

const GATEWAY_RE = /^[A-Za-z0-9_-]{1,32}$/;

function parseArgs(argv) {
  const options = { port: 0, host: "127.0.0.1", blockIntervalMs: 0, gateways: undefined };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (value === undefined) {
      throw new Error(`missing value for ${flag}`);
    }
    if (flag === "--port") {
      options.port = Number.parseInt(value, 10);
    } else if (flag === "--host") {
      options.host = value;
    } else if (flag === "--block-interval-ms") {
      options.blockIntervalMs = Number.parseInt(value, 10);
    } else if (flag === "--gateways") {
      options.gateways = value.split(",").map((entry) => {
        const [id, operator] = entry.split(":");
        if (!GATEWAY_RE.test(id ?? "") || !operator) {
          throw new Error(`bad gateway entry ${entry}; use id:operator`);
        }
        return { id, operator };
      });
    } else {
      throw new Error(`unknown flag ${flag}`);
    }
  }
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error("--port must be 0-65535");
  }
  if (!Number.isInteger(options.blockIntervalMs) || options.blockIntervalMs < 0) {
    throw new Error("--block-interval-ms must be a non-negative integer");
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const server = await startMockGatewayServer(options);
  process.stdout.write(
    `${JSON.stringify({ ready: true, url: server.url, gateways: server.gateways })}\n`
  );
  const stop = () => {
    server.close().then(
      () => process.exit(0),
      () => process.exit(1)
    );
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
