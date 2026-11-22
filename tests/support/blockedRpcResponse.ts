const BLOCKED_RPC_ERROR = {
  code: -32603,
  message: "Blocked by the local E2E sandbox",
} as const;

function jsonRpcId(value: unknown): unknown {
  return typeof value === "object" && value !== null && "id" in value
    ? value.id
    : null;
}

// A JSON-RPC error for every call in a single or batched request body.
export function blockedRpcResponseBody(postData: string | null): unknown {
  const reply = (id: unknown) => ({
    jsonrpc: "2.0",
    id: id ?? null,
    error: BLOCKED_RPC_ERROR,
  });
  let body: unknown;
  try {
    body = JSON.parse(postData ?? "null");
  } catch {
    return reply(null);
  }
  return Array.isArray(body)
    ? body.map((call) => reply(jsonRpcId(call)))
    : reply(jsonRpcId(body));
}
