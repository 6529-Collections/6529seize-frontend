import test from "node:test";
import assert from "node:assert/strict";
import {
  createAgentApi,
  assertBoundedJson,
  MAX_RESPONSE_BYTES,
} from "./api.mjs";
import { createToolHandler } from "./tools.mjs";

const OTHER_ORIGIN = "https://attacker.example";
const JSON_MEDIA_TYPE = "application/json";
const token = `cms_agent_11111111-1111-4111-8111-111111111111.${"a".repeat(64)}`;
const hash = `sha256:${"b".repeat(64)}`;
const key = "22222222-2222-4222-8222-222222222222";
const candidate = {
  draft_id: "draft-1",
  base_version: 1,
  base_package_hash: hash,
  candidate_package: {
    schema: "6529.cms.package.v1",
    title: "Requested changes",
  },
};
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": JSON_MEDIA_TYPE },
  });

test("credentials only reach fixed environment origins; production excludes staging key", async () => {
  const calls = [];
  const fetchRequest = async (url, init) => {
    calls.push({ url, init });
    return response({ ok: true });
  };
  await createAgentApi(
    { token, stagingApiKey: "staging-only" },
    fetchRequest
  ).request("draft");
  await createAgentApi(
    { environment: "staging", token, stagingApiKey: "staging-only" },
    fetchRequest
  ).request("draft");
  assert.equal(
    calls[0].url,
    "https://api.6529.io/api/profile-cms/agent-session/draft"
  );
  assert.equal(
    calls[1].url,
    "https://api.staging.6529.io/api/profile-cms/agent-session/draft"
  );
  assert.deepEqual(calls[0].init.headers, {
    Accept: JSON_MEDIA_TYPE,
    Authorization: `Bearer ${token}`,
  });
  assert.deepEqual(calls[1].init.headers, {
    Accept: JSON_MEDIA_TYPE,
    Authorization: `Bearer ${token}`,
    "x-6529-auth": "staging-only",
  });
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.credentials, "omit");
  assert.throws(
    () => createAgentApi({ environment: OTHER_ORIGIN, token }),
    /production or staging/
  );
});

test("arbitrary routes, broad wallet JWTs and proposal traversal never fetch", async () => {
  let calls = 0;
  const api = createAgentApi({ token }, async () => {
    calls++;
    return response({});
  });
  await assert.rejects(api.request("../../packages/upload"));
  await assert.rejects(api.request(OTHER_ORIGIN));
  await assert.rejects(
    createAgentApi({ token: "eyJwebsite-jwt" }, async () => {
      calls++;
    }).request("draft")
  );
  const tool = createToolHandler(api, {});
  await assert.rejects(tool("cms_get_proposal", { proposal_id: `${key}\n` }));
  await assert.rejects(
    tool("cms_read_draft", { token, url: OTHER_ORIGIN })
  );
  assert.equal(calls, 0);
});

test("a lost submission response retries the identical key/body without an automatic retry", async () => {
  const calls = [];
  const api = createAgentApi({ token }, async (_url, init) => {
    calls.push(init.body);
    if (calls.length === 1) throw new Error("socket closed after commit");
    return response({ id: key, status: "pending" });
  });
  const callTool = createToolHandler(api, {});
  const request = {
    ...candidate,
    idempotency_key: key,
    summary: "Improve all page headings",
  };
  await assert.rejects(
    callTool("cms_submit_proposal", request),
    (error) => error.code === "cms_adapter_transport_error"
  );
  assert.equal(calls.length, 1);
  assert.equal((await callTool("cms_submit_proposal", request)).id, key);
  assert.equal(calls[0], calls[1]);
  assert.equal(JSON.parse(calls[0]).idempotency_key, key);
});

test("API diagnostics retain stable status/code without exposing arbitrary response text", async () => {
  const api = createAgentApi({ token }, async () =>
    response(
      { code: "cms_agent_base_changed", message: "private website text" },
      409
    )
  );
  await assert.rejects(
    api.request("proposals/validate", candidate),
    (error) =>
      error.code === "cms_agent_base_changed" &&
      error.status === 409 &&
      !error.message.includes("private website text")
  );
});

test("validation retains warnings and the server-normalized complete candidate", async () => {
  const result = {
    valid: true,
    candidate_package: {
      payload: { pages: [{ id: "home" }, { id: "about" }] },
    },
    validation: { issues: [{ severity: "warning", code: "media.snapshot" }] },
    candidate_package_hash: hash,
  };
  const tool = createToolHandler(
    createAgentApi({ token }, async () => response(result)),
    {}
  );
  assert.deepEqual(await tool("cms_validate_candidate", candidate), result);
});

test("candidate hashes use the fixed protocol pattern before any API call", async () => {
  let calls = 0;
  const tool = createToolHandler(
    createAgentApi({ token }, async () => {
      calls++;
      return response({ valid: true });
    }),
    {}
  );
  for (const value of [hash.toUpperCase(), `${hash}\n`, "sha256:(a+)+$", 42])
    await assert.rejects(
      tool("cms_validate_candidate", { ...candidate, base_package_hash: value })
    );
  assert.equal(calls, 0);
  await tool("cms_validate_candidate", candidate);
  assert.equal(calls, 1);
});

test("proposal dispositions pass through without inferring publication", async () => {
  for (const status of ["pending", "rejected", "applied"]) {
    const tool = createToolHandler(
      createAgentApi({ token }, async () => response({ id: key, status })),
      {}
    );
    assert.deepEqual(await tool("cms_get_proposal", { proposal_id: key }), {
      id: key,
      status,
    });
  }
});

test("response redirects, oversized streams, malformed JSON and credential echoes are rejected", async () => {
  const factories = [
    () =>
      new Response("", {
        status: 302,
        headers: { location: OTHER_ORIGIN },
      }),
    () => new Response("x".repeat(MAX_RESPONSE_BYTES + 1)),
    () => new Response("<html>gateway error</html>"),
    () => response({ unexpected: token }),
  ];
  for (const factory of factories)
    await assert.rejects(
      createAgentApi({ token }, async () => factory()).request("draft")
    );
});

test("cancellation reaches the HTTP request without retrying", async () => {
  const controller = new AbortController();
  let calls = 0;
  const api = createAgentApi({ token }, async (_url, init) => {
    calls++;
    assert.equal(init.signal.aborted, true);
    throw new Error("aborted");
  });
  controller.abort();
  await assert.rejects(api.request("draft", undefined, controller.signal));
  assert.equal(calls, 1);
});

test("request limits count UTF-8 bytes, nesting, nodes and forbidden keys", () => {
  assert.throws(() => assertBoundedJson({ text: "é".repeat(600000) }));
  let nested = {};
  for (let index = 0; index < 34; index++) nested = { nested };
  assert.throws(() => assertBoundedJson(nested));
  assert.throws(() => assertBoundedJson(Array(50001).fill(null)));
  assert.throws(() =>
    assertBoundedJson(JSON.parse('{"__proto__":{"polluted":true}}'))
  );
  assert.throws(() => assertBoundedJson({ constructor: "unsafe" }));
  assert.equal(
    assertBoundedJson({ title: "Café — Studio" }),
    '{"title":"Café — Studio"}'
  );
});
