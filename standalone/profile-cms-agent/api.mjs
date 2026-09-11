const ORIGINS = Object.freeze({
  production: "https://api.6529.io",
  staging: "https://api.staging.6529.io",
});

export const MAX_REQUEST_BYTES = 1024 * 1024;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_DEPTH = 32;
const MAX_NODES = 50000;
const REQUEST_TIMEOUT_MS = 30000;
export const UUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const TOKEN_PATTERN =
  /^cms_agent_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.[a-f0-9]{64}$/i;
const ROUTES = new Set(["draft", "proposals/validate", "proposals"]);

export class AgentError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "AgentError";
    this.code = code;
    this.status = status;
  }
}

export function assertBoundedJson(value) {
  const queue = [{ value, depth: 0 }];
  const seen = new WeakSet();
  let nodes = 0;
  while (queue.length > 0) {
    const item = queue.pop();
    if (++nodes > MAX_NODES || item.depth > MAX_DEPTH) throw tooLarge();
    if (item.value === null || typeof item.value !== "object") continue;
    if (seen.has(item.value)) throw invalidArguments();
    seen.add(item.value);
    for (const [key, child] of Object.entries(item.value)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw invalidArguments();
      queue.push({ value: child, depth: item.depth + 1 });
    }
  }
  const json = JSON.stringify(value);
  if (typeof json !== "string") throw invalidArguments();
  if (Buffer.byteLength(json, "utf8") > MAX_REQUEST_BYTES) throw tooLarge();
  return json;
}

export function invalidArguments() {
  return new AgentError(
    "cms_adapter_invalid_arguments",
    "The tool arguments do not match the editing contract."
  );
}

function tooLarge() {
  return new AgentError(
    "cms_agent_request_too_large",
    "The proposal exceeds the 1 MiB, depth 32 or 50,000 node limit.",
    413
  );
}

function allowedRoute(route) {
  return (
    ROUTES.has(route) ||
    (route.startsWith("proposals/") &&
      route.length === 46 &&
      UUID_PATTERN.test(route.slice(10)))
  );
}

function errorCode(body) {
  const code = body?.code ?? body?.error_code ?? body?.error?.code;
  return typeof code === "string" && /^cms_agent_[a-z_]{1,70}$/.test(code)
    ? code
    : "cms_adapter_api_error";
}

function statusMessage(status) {
  const messages = {
    400: "The API rejected this proposal. Read the editing constraints and validate again.",
    401: "Agent access is missing, expired or revoked. The owner must create new access in the website editor.",
    403: "This request is not authorized. Staging also requires its separate gateway key.",
    404: "The selected draft or proposal is unavailable to this grant.",
    409: "The proposal base or idempotency key conflicts. Do not silently target another draft or create another submission.",
    413: "The proposal is too large or too deeply nested.",
    429: "The agent access quota is exhausted. Ask the owner to review the remaining access.",
    503: "Agent access is temporarily unavailable. Retry only the same submission and idempotency key.",
  };
  return (
    messages[status] ??
    "The API request failed. A submission may have completed; retry the identical request with the same idempotency key."
  );
}

async function readResponse(response, secrets) {
  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_RESPONSE_BYTES) {
    await response.body?.cancel().catch(() => undefined);
    throw oversizedResponse();
  }
  if (!response.body) throw invalidResponse();
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) throw oversizedResponse();
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (secrets.some((secret) => secret && text.includes(secret)))
    throw invalidResponse();
  try {
    return JSON.parse(text);
  } catch {
    throw invalidResponse();
  }
}

function invalidResponse() {
  return new AgentError(
    "cms_adapter_invalid_response",
    "The API returned an invalid response. No response content was exposed."
  );
}

function oversizedResponse() {
  return new AgentError(
    "cms_adapter_response_too_large",
    "The API response exceeds the adapter's 2 MiB limit."
  );
}

export function createAgentApi(configuration, fetchRequest = globalThis.fetch) {
  const environment = configuration.environment ?? "production";
  if (!Object.hasOwn(ORIGINS, environment))
    throw new AgentError(
      "cms_adapter_invalid_environment",
      "CMS_AGENT_ENV must be production or staging."
    );
  const token = configuration.token ?? "";
  const stagingKey =
    environment === "staging" ? configuration.stagingApiKey : undefined;
  const origin = ORIGINS[environment];
  return {
    async request(route, body, callerSignal) {
      if (!allowedRoute(route)) throw invalidArguments();
      if (token.length !== 111 || !TOKEN_PATTERN.test(token))
        throw new AgentError(
          "cms_adapter_missing_token",
          "Set CMS_AGENT_TOKEN in the MCP client's environment. Never send a website login token."
        );
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };
      if (stagingKey) headers["x-api-key"] = stagingKey;
      const json = body === undefined ? undefined : assertBoundedJson(body);
      if (json !== undefined) headers["Content-Type"] = "application/json";
      const signal = AbortSignal.any([
        AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        ...(callerSignal ? [callerSignal] : []),
      ]);
      try {
        const response = await fetchRequest(
          `${origin}/api/profile-cms/agent-session/${route}`,
          {
            method: json === undefined ? "GET" : "POST",
            headers,
            body: json,
            redirect: "error",
            credentials: "omit",
            referrerPolicy: "no-referrer",
            signal,
          }
        );
        if (response.status >= 300 && response.status < 400)
          throw invalidResponse();
        const result = await readResponse(response, [token, stagingKey]);
        if (!response.ok)
          throw new AgentError(
            errorCode(result),
            statusMessage(response.status),
            response.status
          );
        if (!result || typeof result !== "object" || Array.isArray(result))
          throw invalidResponse();
        return result;
      } catch (error) {
        if (error instanceof AgentError) throw error;
        throw new AgentError(
          "cms_adapter_transport_error",
          "The request did not finish. A submission may have completed; retry the identical candidate, summary and idempotency key."
        );
      }
    },
  };
}
