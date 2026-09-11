import { publicEnv } from "@/config/env";
import * as Sentry from "@sentry/nextjs";

type NextjsError = Error & { digest?: unknown };

const NEXTJS_RSC_RENDER_ERROR_MESSAGE =
  "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.";
const NEXTJS_DIGEST_PATTERN = /^(?:0|[1-9]\d{0,9})$/;
const MAX_NEXTJS_DIGEST = 0xffffffff;

function getNextjsRscDigest(error: NextjsError): string | undefined {
  const { digest } = error;
  if (
    error.message !== NEXTJS_RSC_RENDER_ERROR_MESSAGE ||
    typeof digest !== "string" ||
    !NEXTJS_DIGEST_PATTERN.test(digest) ||
    Number(digest) > MAX_NEXTJS_DIGEST
  ) {
    return undefined;
  }

  return digest;
}

export function captureNextjsGlobalError(error: NextjsError): void {
  if (!publicEnv.SENTRY_DSN) return;

  const digest = getNextjsRscDigest(error);
  if (!digest) {
    Sentry.captureException(error);
    return;
  }

  Sentry.captureException(error, {
    tags: { digest },
    fingerprint: ["nextjs-rsc-render", digest],
  });
}
