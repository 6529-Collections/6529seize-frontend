import type { RefinementCtx} from "zod";
import { ZodIssueCode } from "zod";

const BASE_ENDPOINT_ALLOWED_DOMAINS = [
  "6529.io",
  "www.6529.io",
  "staging.6529.io",
  "localhost",
  "127.0.0.1",
] as const;

export function validateBaseEndpoint(val: string, ctx: RefinementCtx) {
  let url: URL;
  try {
    url = new URL(val);
  } catch {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: `BASE_ENDPOINT contains invalid URL format: ${val}. Expected format: https://domain.com`,
    });
    return;
  }

  const hostname = url.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (url.protocol !== "https:" && !isLocalhost) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: `BASE_ENDPOINT must use HTTPS protocol. Got: ${url.protocol}//. Only localhost can use HTTP.`,
    });
  }

  const isAllowed = BASE_ENDPOINT_ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  if (!isAllowed) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: `BASE_ENDPOINT domain not in allowlist. Got: ${hostname}. Allowed domains: ${BASE_ENDPOINT_ALLOWED_DOMAINS.join(
        ", "
      )}`,
    });
  }
}
