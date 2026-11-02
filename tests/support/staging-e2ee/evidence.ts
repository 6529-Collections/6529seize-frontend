import type { BrowserContext, Page, Request, Response } from "@playwright/test";

/**
 * Network and browser evidence for the staging E2EE pack: every request body
 * and sent WebSocket frame (to prove plaintext never leaves the browser),
 * E2EE API responses, the MLS WebAssembly fetch, the served CSP and any CSP
 * violations. Nothing recorded here is printed whole; failures report only
 * which secret-free needle matched which endpoint.
 */

/** Bodies larger than this are recorded by size only (E2EE chunks are 1 MiB). */
const MAX_RECORDED_BODY_BYTES = 4 * 1024 * 1024;
const MIN_ENCODED_NEEDLE_LENGTH = 12;
const CSP_VIOLATION_BINDING = "__6529QaCspViolation";
const E2EE_API_PATH = /^\/api\/e2ee\//u;
const MLS_WASM_PATH = /^\/e2ee\/mls-wasm-[0-9a-f]+\.wasm$/u;

export interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly body: Buffer | null;
  readonly bodyBytes: number;
}

export interface RecordedResponse {
  readonly method: string;
  readonly path: string;
  readonly status: number;
}

export interface RecordedWasmResponse {
  readonly path: string;
  readonly status: number;
  readonly contentType: string | null;
}

export interface RecordedCspViolation {
  readonly directive: string;
  readonly blockedURI: string;
  readonly sourceFile: string;
}

export interface PlaintextLeak {
  readonly needle: string;
  readonly where: string;
}

function base64Variants(bytes: Buffer): string[] {
  const variants: string[] = [];
  // Data can start at any byte offset inside a larger base64 field. Encode
  // the needle at each of the three alignments and keep only the characters
  // that depend on needle bytes alone.
  for (let offset = 0; offset < 3; offset += 1) {
    const padded = Buffer.concat([Buffer.alloc(offset), bytes]);
    const fullGroups = Math.floor(padded.length / 3);
    const start = offset === 0 ? 0 : 4;
    const end = fullGroups * 4;
    for (const encoding of ["base64", "base64url"] as const) {
      const encoded = padded.toString(encoding).slice(start, end);
      if (encoded.length >= MIN_ENCODED_NEEDLE_LENGTH) {
        variants.push(encoded);
      }
    }
  }
  return variants;
}

/**
 * The forms in which `value` would appear on the wire if it were sent
 * unencrypted: raw, JSON-escaped, hex and base64/base64url at any alignment.
 */
export function plaintextEncodings(value: string | Buffer): string[] {
  const bytes = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  const forms = new Set<string>(base64Variants(bytes));
  forms.add(bytes.toString("hex"));
  if (typeof value === "string") {
    forms.add(value);
    forms.add(JSON.stringify(value).slice(1, -1));
    forms.add(
      JSON.stringify(value)
        .slice(1, -1)
        .replaceAll(
          /[\u007f-￿]/gu,
          (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
        )
    );
    forms.add(encodeURIComponent(value));
  }
  return [...forms].filter((form) => form.length > 0);
}

/** Every needle form found in `haystack`, by needle name. */
export function findPlaintext(
  haystack: string,
  needles: ReadonlyMap<string, readonly string[]>
): string[] {
  const found: string[] = [];
  for (const [name, forms] of needles) {
    if (forms.some((form) => haystack.includes(form))) {
      found.push(name);
    }
  }
  return found;
}

function endpointLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "[unparseable URL]";
  }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

export class E2eeNetworkEvidence {
  readonly requests: RecordedRequest[] = [];
  readonly webSocketFrames: string[] = [];
  readonly e2eeResponses: RecordedResponse[] = [];
  readonly wasmResponses: RecordedWasmResponse[] = [];
  readonly documentCsp: { readonly path: string; readonly csp: string }[] = [];
  readonly cspViolations: RecordedCspViolation[] = [];

  constructor(private readonly origin: string) {}

  /** Call before the context opens any page. */
  async attach(context: BrowserContext): Promise<void> {
    await context.exposeBinding(
      CSP_VIOLATION_BINDING,
      (_source, violation: RecordedCspViolation) => {
        this.cspViolations.push(violation);
      }
    );
    await context.addInitScript((binding: string) => {
      document.addEventListener("securitypolicyviolation", (event) => {
        const report: unknown = Reflect.get(globalThis, binding);
        if (typeof report === "function") {
          Reflect.apply(report, globalThis, [
            {
              directive: event.effectiveDirective,
              blockedURI: event.blockedURI,
              sourceFile: event.sourceFile,
            },
          ]);
        }
      });
    }, CSP_VIOLATION_BINDING);
    context.on("request", (request) => this.onRequest(request));
    context.on("response", (response) => this.onResponse(response));
  }

  /** WebSocket frames are per page. */
  watchPage(page: Page): void {
    page.on("websocket", (socket) => {
      socket.on("framesent", ({ payload }) => {
        this.webSocketFrames.push(
          typeof payload === "string" ? payload : payload.toString("utf8")
        );
      });
    });
  }

  private onRequest(request: Request): void {
    const body = request.postDataBuffer();
    const bodyBytes = body?.length ?? 0;
    this.requests.push({
      method: request.method(),
      url: request.url(),
      body: body && bodyBytes <= MAX_RECORDED_BODY_BYTES ? body : null,
      bodyBytes,
    });
  }

  private onResponse(response: Response): void {
    const request = response.request();
    const path = pathOf(response.url());
    if (E2EE_API_PATH.test(path)) {
      this.e2eeResponses.push({
        method: request.method(),
        path,
        status: response.status(),
      });
    }
    if (MLS_WASM_PATH.test(path)) {
      this.wasmResponses.push({
        path,
        status: response.status(),
        contentType: response.headers()["content-type"] ?? null,
      });
    }
    if (
      request.isNavigationRequest() &&
      request.resourceType() === "document" &&
      response.url().startsWith(this.origin)
    ) {
      const csp = response.headers()["content-security-policy"];
      if (csp) {
        this.documentCsp.push({ path, csp });
      }
    }
  }

  /** Requests whose body exceeded the recording limit (cannot be scanned). */
  unscannedRequests(): string[] {
    return this.requests
      .filter((request) => request.bodyBytes > 0 && request.body === null)
      .map(
        (request) =>
          `${request.method} ${endpointLabel(request.url)} (${request.bodyBytes} bytes)`
      );
  }

  /** Where any needle appeared in a URL, body or sent WebSocket frame. */
  findLeaks(needles: ReadonlyMap<string, readonly string[]>): PlaintextLeak[] {
    const leaks: PlaintextLeak[] = [];
    for (const request of this.requests) {
      const where = `${request.method} ${endpointLabel(request.url)}`;
      // ASCII encodings survive UTF-8 decoding of binary bodies unchanged.
      const haystack = request.body
        ? `${request.url}\n${request.body.toString("utf8")}`
        : request.url;
      for (const needle of findPlaintext(haystack, needles)) {
        leaks.push({ needle, where });
      }
    }
    for (const frame of this.webSocketFrames) {
      for (const needle of findPlaintext(frame, needles)) {
        leaks.push({ needle, where: "WebSocket frame sent" });
      }
    }
    return leaks;
  }

  requestsMatching(method: string, path: RegExp): RecordedRequest[] {
    return this.requests.filter(
      (request) => request.method === method && path.test(pathOf(request.url))
    );
  }
}
