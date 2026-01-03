import { publicEnv } from "@/config/env";

export function extractErrorDetails(
  err: Error & { digest?: string | undefined },
  context?: string
): string {
  if (context && publicEnv.NODE_ENV !== "production") {
    console.error(`[${context}] Full error object:`, err);
    console.error(`[${context}] Error stack:`, err.stack);
    console.error(
      `[${context}] All properties:`,
      Object.getOwnPropertyNames(err)
    );
  }

  if (err.stack) {
    return err.stack;
  }

  if (err.message) {
    return err.message;
  }

  return String(err);
}
