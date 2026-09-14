import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { MAX_MESSAGE_BYTES } from "./server.mjs";

const executable = fileURLToPath(new URL("./main.mjs", import.meta.url));
const preload = new URL("./test-fixtures/api.mjs", import.meta.url).href;
const TOOL_CALL = "tools/call";
const token = `cms_agent_11111111-1111-4111-8111-111111111111.${"a".repeat(64)}`;

async function client(t, mode = "normal") {
  const child = spawn(process.execPath, ["--import", preload, executable], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    env: {
      SystemRoot: process.env.SystemRoot ?? "",
      CMS_AGENT_TOKEN: token,
      CMS_ADAPTER_TEST_MODE: mode,
    },
  });
  const messages = [];
  let stderr = "";
  let buffered = "";
  child.stderr.setEncoding("utf8").on("data", (text) => {
    stderr += text;
  });
  child.stdout.setEncoding("utf8").on("data", (text) => {
    buffered += text;
    const lines = buffered.split("\n");
    buffered = lines.pop();
    for (const line of lines) messages.push(JSON.parse(line));
  });
  t.after(() => {
    child.kill();
    assert.equal(stderr.includes(token), false);
  });
  const send = (method, id, params) =>
    child.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", method, ...(id !== undefined ? { id } : {}), ...(params !== undefined ? { params } : {}) })}\n`
    );
  async function receive(id) {
    const started = Date.now();
    while (Date.now() - started < 4000) {
      const match = messages.findIndex((item) => item.id === id);
      if (match >= 0) return messages.splice(match, 1)[0];
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    throw new Error(
      `No response for request ${id}; stderr length ${stderr.length}`
    );
  }
  return { child, send, receive, messages, getStderr: () => stderr };
}

async function initialize(c) {
  c.send("initialize", 1, {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "raw-stdio-integration-client", version: "1" },
  });
  const initialized = await c.receive(1);
  assert.equal(initialized.result.protocolVersion, "2025-11-25");
  assert.deepEqual(initialized.result.capabilities, { tools: {} });
  c.send("notifications/initialized");
}

test("real subprocess lists five tools and reads full pinned schema and selected draft", async (t) => {
  const c = await client(t);
  await initialize(c);
  c.send("tools/list", 2, {});
  assert.equal((await c.receive(2)).result.tools.length, 5);
  c.send(TOOL_CALL, 3, { name: "cms_read_schema", arguments: {} });
  const schemas = JSON.parse((await c.receive(3)).result.content[0].text);
  assert.equal(
    schemas.package_schema.properties.schema.const,
    "6529.cms.package.v1"
  );
  assert.ok(schemas.package_schema.$defs);
  c.send(TOOL_CALL, 4, { name: "cms_read_draft", arguments: {} });
  const draft = JSON.parse((await c.receive(4)).result.content[0].text);
  assert.equal(draft.cms_package.site.title, "Café — Studio");
  assert.equal(c.getStderr(), "");
});

test("real subprocess validates and submits only explicit complete requests", async (t) => {
  const c = await client(t);
  await initialize(c);
  const request = {
    draft_id: "draft-1",
    base_version: 1,
    base_package_hash: `sha256:${"b".repeat(64)}`,
    candidate_package: {
      schema: "6529.cms.package.v1",
      pages: ["home", "about"],
    },
    idempotency_key: "22222222-2222-4222-8222-222222222222",
    summary: "Improve the two pages",
  };
  c.send(TOOL_CALL, 2, { name: "cms_submit_proposal", arguments: request });
  const result = JSON.parse((await c.receive(2)).result.content[0].text);
  assert.deepEqual(result.received, request);
  assert.equal(result.submissions, 1);
  assert.equal(result.authorizationPresent, true);
  assert.equal(result.redirect, "error");
  c.send(TOOL_CALL, 3, {
    name: "cms_submit_proposal",
    arguments: { ...request, token },
  });
  assert.equal((await c.receive(3)).result.isError, true);
});

test("split UTF-8 messages, malformed JSON and unknown methods leave protocol usable", async (t) => {
  const c = await client(t);
  c.child.stdin.write("{bad json}\n");
  assert.equal((await c.receive(null)).error.code, -32700);
  c.send("server/discover", 2, {});
  assert.ok((await c.receive(2)).error);
  await initialize(c);
  const line = Buffer.from(
    `${JSON.stringify({ jsonrpc: "2.0", id: "café", method: "ping" })}\n`
  );
  const split = line.indexOf(Buffer.from("é")) + 1;
  c.child.stdin.write(line.subarray(0, split));
  c.child.stdin.write(line.subarray(split));
  assert.deepEqual((await c.receive("café")).result, {});
  c.send(TOOL_CALL, 4, { name: "publish", arguments: {} });
  assert.equal((await c.receive(4)).error.code, -32602);
});

test("cancellation suppresses responses and EOF exits a waiting real process", async (t) => {
  const c = await client(t, "pending");
  await initialize(c);
  c.send(TOOL_CALL, 2, { name: "cms_read_draft", arguments: {} });
  c.send("notifications/cancelled", undefined, { requestId: 2 });
  c.send("ping", 3);
  assert.deepEqual((await c.receive(3)).result, {});
  const exited = once(c.child, "exit");
  c.child.stdin.end();
  await exited;
  assert.equal(
    c.messages.some((message) => message.id === 2),
    false
  );
});

test("oversized input is rejected and the real server terminates", async (t) => {
  const c = await client(t);
  const exited = once(c.child, "exit");
  c.child.stdin.on("error", () => undefined);
  c.child.stdin.write("x".repeat(MAX_MESSAGE_BYTES + 1));
  assert.equal((await c.receive(null)).error.code, -32600);
  await exited;
});

test("a real client cannot exceed four pending API requests", async (t) => {
  const c = await client(t, "pending");
  await initialize(c);
  for (let id = 2; id <= 6; id++) {
    c.send(TOOL_CALL, id, { name: "cms_read_draft", arguments: {} });
  }
  const rejected = await c.receive(6);
  assert.equal(rejected.error.code, -32000);
  assert.match(rejected.error.message, /Too many active/);
  const exited = once(c.child, "exit");
  c.child.stdin.end();
  await exited;
});

test("a newer client can fall back to the supported 2025 protocol", async (t) => {
  const c = await client(t);
  c.send("server/discover", 9, {});
  assert.equal((await c.receive(9)).error.code, -32601);
  c.send("initialize", 1, {
    protocolVersion: "2026-07-28",
    capabilities: {},
    _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" },
    clientInfo: { name: "newer-compatible-client", version: "1" },
  });
  assert.equal((await c.receive(1)).result.protocolVersion, "2025-11-25");
  c.send("notifications/initialized");
  c.send("tools/list", 2, {});
  assert.equal((await c.receive(2)).result.tools.length, 5);
  c.send(TOOL_CALL, 3, { name: "cms_read_schema", arguments: {} });
  assert.equal(
    JSON.parse((await c.receive(3)).result.content[0].text).package_schema
      .properties.schema.const,
    "6529.cms.package.v1"
  );
});
