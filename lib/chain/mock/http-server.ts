/**
 * The mock chain behind HTTP, for CI and local runs (Node only).
 *
 * Several gateways of different operators share one mock chain, each under
 * its own base URL `/g/{id}/`, speaking wire format v0 (`gateway/wire.ts`).
 * Control routes under `/_mock/` drive the chain: produce a block, settle a
 * decision, inject a handler failure, change a gateway's behaviour. Run it
 * with `node scripts/mock-chain-gateway.cjs`.
 *
 * It binds to loopback by default and answers CORS only for loopback
 * origins, so a local static or dev build can call it.
 */
import { once } from "node:events";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import type { Hex } from "viem";

import { MAX_TX_BYTES } from "../codec/envelope";
import { ChainResultCode } from "../codec/errors";
import { checkTxAnswerJson, gatewayHeadJson, txLocationJson } from "../gateway/wire";
import type { GatewayRef } from "../status-ladder";
import {
  createMockChain,
  type MockChain,
  type MockChainOptions,
  type MockGateway,
  type MockGatewayBehavior,
} from "./chain";

export interface MockGatewaySpec extends GatewayRef {
  readonly behavior?: MockGatewayBehavior;
}

export interface MockGatewayServerOptions extends MockChainOptions {
  readonly host?: string;
  /** 0 picks a free port. */
  readonly port?: number;
  readonly gateways?: readonly MockGatewaySpec[];
  /** Produce a block every N ms; 0 means only on `POST /_mock/block`. */
  readonly blockIntervalMs?: number;
}

export interface MockGatewayServer {
  readonly url: string;
  readonly gateways: readonly (GatewayRef & { readonly url: string })[];
  readonly chain: MockChain;
  close(): Promise<void>;
}

export const DEFAULT_MOCK_GATEWAYS: readonly MockGatewaySpec[] = [
  { id: "a", operator: "operator-a" },
  { id: "b", operator: "operator-b" },
  { id: "c", operator: "operator-c" },
];

const MAX_CONTROL_BYTES = 4 * 1024;
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** Interfaces the mock may bind: loopback only. */
const BIND_HOSTS: ReadonlySet<string> = new Set(["127.0.0.1", "localhost", "::1"]);
const LOOPBACK_BASE = "http://127.0.0.1";
const GATEWAY_ID_RE = /^[A-Za-z0-9_-]{1,32}$/;
const BEHAVIORS: readonly MockGatewayBehavior[] = ["honest", "silent", "censor", "liar"];

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body, (_key, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value
  ));
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      LOOPBACK_HOSTS.has(url.hostname) &&
      url.origin === origin
    );
  } catch {
    return false;
  }
}

interface GatewayRoute {
  readonly id: string;
  readonly resource: "tx" | "head";
  readonly txId: string | undefined;
}

/** `/g/{id}/v0/tx`, `/g/{id}/v0/tx/{txId}` or `/g/{id}/v0/head`. */
function gatewayRoute(path: string): GatewayRoute | null {
  const [empty, g, id = "", version, resource, txId, ...rest] = path.split("/");
  if (empty !== "" || g !== "g" || version !== "v0" || rest.length > 0 || !GATEWAY_ID_RE.test(id)) {
    return null;
  }
  if (resource === "head" && txId === undefined) {
    return { id, resource, txId };
  }
  if (resource === "tx" && (txId === undefined || HASH_RE.test(txId))) {
    return { id, resource, txId };
  }
  return null;
}

function allowCors(request: IncomingMessage, response: ServerResponse): void {
  const origin = request.headers.origin;
  if (typeof origin === "string" && isLoopbackOrigin(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "origin");
    response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    response.setHeader("access-control-allow-headers", "content-type");
  }
}

async function readBody(request: IncomingMessage, limit: number): Promise<Uint8Array | null> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = chunk instanceof Uint8Array ? chunk : new TextEncoder().encode(String(chunk));
    size += bytes.length;
    if (size > limit) {
      return null;
    }
    chunks.push(bytes);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function readJson(request: IncomingMessage): Promise<Readonly<Record<string, unknown>>> {
  const body = await readBody(request, MAX_CONTROL_BYTES);
  if (body === null) {
    throw new HttpError(413, "control body too large");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new HttpError(400, "invalid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new HttpError(400, "expected a JSON object");
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function hashField(json: Readonly<Record<string, unknown>>, name: string): Hex {
  const value = json[name];
  if (typeof value !== "string" || !HASH_RE.test(value)) {
    throw new HttpError(400, `${name} must be a 32-byte hash`);
  }
  return value.toLowerCase() as Hex;
}

function decimalField(json: Readonly<Record<string, unknown>>, name: string): bigint {
  const value = json[name];
  if (typeof value !== "string" || !/^\d{1,20}$/.test(value)) {
    throw new HttpError(400, `${name} must be a decimal string`);
  }
  return BigInt(value);
}

async function handleGateway(
  gateway: MockGateway,
  route: GatewayRoute,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (route.resource === "head" && request.method === "GET") {
    send(response, 200, gatewayHeadJson(await gateway.head()));
    return;
  }
  if (route.resource === "tx" && route.txId !== undefined && request.method === "GET") {
    send(response, 200, txLocationJson(await gateway.locate(route.txId.toLowerCase() as Hex)));
    return;
  }
  if (route.resource === "tx" && route.txId === undefined && request.method === "POST") {
    const body = await readBody(request, MAX_TX_BYTES);
    const answer =
      body === null
        ? { code: ChainResultCode.OVERSIZE, detail: 0 }
        : await gateway.submit(body);
    send(response, 200, checkTxAnswerJson(answer));
    return;
  }
  throw new HttpError(405, "method not allowed");
}

async function handleControl(
  chain: MockChain,
  gateways: ReadonlyMap<string, MockGateway>,
  path: string,
  request: IncomingMessage
): Promise<unknown> {
  if (path === "/_mock/state" && request.method === "GET") {
    return { head: chain.head(), network: chain.network, gateways: [...gateways.keys()] };
  }
  if (request.method !== "POST") {
    throw new HttpError(405, "method not allowed");
  }
  if (path === "/_mock/block") {
    return chain.produceBlock();
  }
  const json = await readJson(request);
  switch (path) {
    case "/_mock/settle":
      return {
        decisionId: chain.settleDecision(
          hashField(json, "competitionId"),
          decimalField(json, "decisionTimeMs")
        ),
      };
    case "/_mock/fail":
      chain.injectFailure(hashField(json, "txId"), Number(decimalField(json, "code")));
      return { ok: true };
    case "/_mock/behavior":
      return setBehavior(gateways, json);
    default:
      throw new HttpError(404, "unknown control route");
  }
}

function setBehavior(
  gateways: ReadonlyMap<string, MockGateway>,
  json: Readonly<Record<string, unknown>>
): unknown {
  const gateway = typeof json["gateway"] === "string" ? gateways.get(json["gateway"]) : undefined;
  const behavior = BEHAVIORS.find((b) => b === json["behavior"]);
  if (gateway === undefined || behavior === undefined) {
    throw new HttpError(400, "unknown gateway or behavior");
  }
  gateway.setBehavior(behavior);
  return { ok: true };
}

async function routeRequest(
  chain: MockChain,
  gateways: ReadonlyMap<string, MockGateway>,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const path = new URL(request.url ?? "/", LOOPBACK_BASE).pathname;
  const route = gatewayRoute(path);
  if (route !== null) {
    const gateway = gateways.get(route.id);
    if (gateway === undefined) {
      throw new HttpError(404, "unknown gateway");
    }
    await handleGateway(gateway, route, request, response);
    return;
  }
  if (!path.startsWith("/_mock/")) {
    throw new HttpError(404, "not found");
  }
  send(response, 200, await handleControl(chain, gateways, path, request));
}

/** Never rejects: every failure becomes a response or a dropped connection. */
async function handleRequest(
  chain: MockChain,
  gateways: ReadonlyMap<string, MockGateway>,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  allowCors(request, response);
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }
  try {
    await routeRequest(chain, gateways, request, response);
  } catch (error: unknown) {
    errorResponse(response, error);
  }
}

function errorResponse(response: ServerResponse, error: unknown): void {
  if (error instanceof HttpError) {
    send(response, error.status, { error: error.message });
  } else if (error instanceof Error && error.message.includes("is silent")) {
    // A silent gateway never answers; drop the connection instead.
    response.destroy();
  } else {
    send(response, 500, { error: error instanceof Error ? error.message : "internal error" });
  }
}

async function listen(server: Server, port: number, host: string): Promise<number> {
  server.listen(port, host);
  await once(server, "listening");
  const address = server.address();
  return typeof address === "object" && address !== null ? address.port : port;
}

export async function startMockGatewayServer(
  options: MockGatewayServerOptions = {}
): Promise<MockGatewayServer> {
  const host = options.host ?? "127.0.0.1";
  if (!BIND_HOSTS.has(host)) {
    throw new RangeError("the mock gateway binds loopback only: 127.0.0.1, localhost or ::1");
  }
  const chain = createMockChain(options);
  const specs = options.gateways ?? DEFAULT_MOCK_GATEWAYS;
  const gateways = new Map<string, MockGateway>(
    specs.map((spec) => [
      spec.id,
      chain.gateway({ id: spec.id, operator: spec.operator }, spec.behavior),
    ])
  );
  const server = createServer((request, response) => {
    void handleRequest(chain, gateways, request, response);
  });
  const port = await listen(server, options.port ?? 0, host);
  const base = new URL(LOOPBACK_BASE);
  base.hostname = host.includes(":") ? "[" + host + "]" : host;
  base.port = String(port);
  const url = base.origin;
  const interval =
    options.blockIntervalMs !== undefined && options.blockIntervalMs > 0
      ? setInterval(() => chain.produceBlock(), options.blockIntervalMs)
      : null;
  return {
    url,
    chain,
    gateways: specs.map((spec) => ({ id: spec.id, operator: spec.operator, url: `${url}/g/${spec.id}/` })),
    close: async () => {
      if (interval !== null) {
        clearInterval(interval);
      }
      const closed = once(server, "close");
      server.close();
      server.closeAllConnections();
      await closed;
    },
  };
}
