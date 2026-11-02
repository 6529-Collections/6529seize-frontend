type QaRuntime = Pick<
  typeof import("./node-engine"),
  "buildE2eeApiClient" | "E2eeApiError"
>;

interface QaResponse {
  ok(): boolean;
  status(): number;
  json(): Promise<unknown>;
}

interface QaRequestClient {
  fetch(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      maxRedirects: number;
      data?: object;
    }
  ): Promise<QaResponse>;
}

interface QaHeaders {
  authorization: string;
  "x-6529-auth": string;
}

function errorDetails(body: unknown) {
  if (typeof body !== "object" || body === null)
    return { code: null, currentEpoch: null };
  const code = "code" in body ? body.code : null;
  const epoch = "current_epoch" in body ? body.current_epoch : null;
  return {
    code:
      typeof code === "string" && /^E2EE_[A-Z0-9_]{1,80}$/u.test(code)
        ? code
        : null,
    currentEpoch:
      typeof epoch === "number" && Number.isSafeInteger(epoch) && epoch >= 0
        ? epoch
        : null,
  };
}

/** Both credentials stay in memory; never follow a redirect to another host. */
export function buildStagingQaApi(
  client: QaRequestClient,
  headers: QaHeaders,
  { buildE2eeApiClient, E2eeApiError }: QaRuntime
) {
  const send = async <T>(
    method: string,
    endpoint: string,
    params?: Record<string, string>,
    body?: object
  ): Promise<T> => {
    const url = new URL(`/api/${endpoint}`, "https://api.staging.6529.io");
    for (const [key, value] of Object.entries(params ?? {}))
      url.searchParams.set(key, value);
    const response = await client
      .fetch(url.toString(), {
        method,
        headers: { ...headers },
        maxRedirects: 0,
        ...(body ? { data: body } : {}),
      })
      .catch(() => {
        throw new Error("Staging QA transport failed");
      });
    const result = await response.json();
    if (!response.ok()) {
      const { code, currentEpoch } = errorDetails(result);
      throw new E2eeApiError({
        message: `Staging QA API ${method} failed (HTTP ${response.status()}${code ? `, ${code}` : ""})`,
        status: response.status(),
        code,
        currentEpoch,
      });
    }
    return result as T;
  };
  return buildE2eeApiClient({
    get: <T>(endpoint: string, params?: Record<string, string>) =>
      send<T>("GET", endpoint, params),
    post: <T>(endpoint: string, body: object) =>
      send<T>("POST", endpoint, undefined, body),
    put: <T>(endpoint: string, body: object) =>
      send<T>("PUT", endpoint, undefined, body),
  });
}
