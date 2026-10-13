import { readLimitedText } from "@/lib/fetch/limitedBody";
import { discardResponse } from "@/lib/fetch/fetchDeadline";
import { fetchPublicUrl, parsePublicUrl } from "@/lib/security/urlGuard";
import {
  createPublicClient,
  http,
  HttpRequestError,
  isHex,
  type CcipRequestParameters,
  type Chain,
  type Hex,
  type HttpTransport,
  type PublicClient,
} from "viem";

const CCIP_GATEWAY_TIMEOUT_MS = 4_000;
const CCIP_GATEWAY_MAX_BYTES = 256 * 1024;
const CCIP_GATEWAY_MAX_URLS = 3;

type ServerPublicClientOptions<chain extends Chain> = {
  readonly chain: chain;
  readonly timeoutMs: number;
  /** Omit to use the chain's default public RPC URL. */
  readonly rpcUrl?: string | undefined;
};

function toGatewayError(url: string, error: unknown): HttpRequestError {
  if (error instanceof HttpRequestError) {
    return error;
  }
  return new HttpRequestError({
    url,
    details: error instanceof Error ? error.message : String(error),
  });
}

function parseGatewayJsonData(url: string, text: string): unknown {
  try {
    return (JSON.parse(text) as { readonly data?: unknown } | null)?.data;
  } catch {
    throw new HttpRequestError({
      url,
      details: "Gateway returned invalid JSON.",
    });
  }
}

/**
 * Mirrors viem's default EIP-3668 gateway request, but only over HTTPS through
 * the guarded public-URL fetcher, with a deadline and a response size cap.
 */
async function requestGateway(
  url: string,
  { data, requestOptions, sender }: Omit<CcipRequestParameters, "urls">
): Promise<Hex> {
  const method = url.includes("{data}") ? "GET" : "POST";
  const gatewayUrl = parsePublicUrl(
    url.replaceAll("{sender}", sender.toLowerCase()).replaceAll("{data}", data),
    { allowedProtocols: ["https:"] }
  );
  const response = await fetchPublicUrl(
    gatewayUrl,
    {
      method,
      signal: requestOptions?.signal ?? null,
      ...(method === "POST"
        ? {
            body: JSON.stringify({ data, sender }),
            headers: { "Content-Type": "application/json" },
          }
        : {}),
    },
    { timeoutMs: CCIP_GATEWAY_TIMEOUT_MS, maxRedirects: 0 }
  );

  if (!response.ok) {
    discardResponse(response);
    throw new HttpRequestError({
      url,
      status: response.status,
      details: response.statusText,
    });
  }

  const text = await readLimitedText(response, CCIP_GATEWAY_MAX_BYTES);
  const isJson = response.headers
    .get("content-type")
    ?.toLowerCase()
    .startsWith("application/json");
  const result = isJson ? parseGatewayJsonData(url, text) : text;

  if (!isHex(result)) {
    throw new HttpRequestError({
      url,
      details: "Gateway response data must be a hex value.",
    });
  }

  return result;
}

async function requestCcipGateway({
  urls,
  ...parameters
}: CcipRequestParameters): Promise<Hex> {
  const signal = parameters.requestOptions?.signal;
  let lastError: Error = new Error("No CCIP-Read gateway URL was provided.");

  for (const url of urls.slice(0, CCIP_GATEWAY_MAX_URLS)) {
    signal?.throwIfAborted();
    try {
      return await requestGateway(url, parameters);
    } catch (error) {
      signal?.throwIfAborted();
      lastError = toGatewayError(url, error);
    }
  }

  throw lastError;
}

/**
 * Creates a server-side viem public client. Every server client must come from
 * here so CCIP-Read gateway requests always go through the guarded fetcher.
 */
export function createServerPublicClient<const chain extends Chain>({
  chain,
  timeoutMs,
  rpcUrl,
}: ServerPublicClientOptions<chain>): PublicClient<HttpTransport, chain> {
  return createPublicClient({
    chain,
    ccipRead: { request: requestCcipGateway },
    transport: http(rpcUrl, { retryCount: 0, timeout: timeoutMs }),
  });
}
