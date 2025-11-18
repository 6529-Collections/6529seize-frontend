import { publicEnv } from "@/config/env";

export function extractErrorDetails(
  err: Error & { digest?: string },
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

  const parts: string[] = [];

  if (err.digest) {
    parts.push(`Digest: ${err.digest}`);
  }

  if (err.message) {
    const isGenericNextError = err.message.includes(
      "An error occurred in the Server Components render"
    );
    const stackIsSameAsMessage =
      err.stack && err.stack.trim().startsWith(err.message.trim());

    if (isGenericNextError) {
      parts.push(`\n\nMessage: ${err.message}`);
      if (err.digest) {
        parts.push(
          `\n\nNote: Check server logs for full error details. Search for digest: ${err.digest}`
        );
      }
    } else {
      parts.push(`\n\nMessage: ${err.message}`);
    }

    if (err.stack && !stackIsSameAsMessage) {
      parts.push(`\n\nStack Trace:\n${err.stack}`);
    }
  } else if (err.stack) {
    parts.push(`Stack Trace:\n${err.stack}`);
  }

  const errorName = err.name?.trim();
  if (errorName && errorName !== "Error") {
    parts.push(`\n\nError Name: ${errorName}`);
  }

  if (err.cause) {
    let causeString: string;
    if (err.cause !== null && typeof err.cause === "object") {
      causeString = JSON.stringify(err.cause, null, 2);
    } else if (
      typeof err.cause === "string" ||
      typeof err.cause === "number" ||
      typeof err.cause === "boolean" ||
      typeof err.cause === "bigint" ||
      typeof err.cause === "symbol" ||
      err.cause === null ||
      err.cause === undefined
    ) {
      causeString = String(err.cause);
    } else {
      causeString = JSON.stringify(err.cause, null, 2);
    }
    parts.push(`\n\nCause: ${causeString}`);
  }

  const allProps = Object.getOwnPropertyNames(err);
  const additionalProps = allProps.filter(
    (prop) => !["message", "stack", "name", "cause", "digest"].includes(prop)
  );

  if (additionalProps.length > 0) {
    parts.push(`\n\nAdditional Properties:`);
    additionalProps.forEach((prop) => {
      try {
        const value = (err as unknown as Record<string, unknown>)[prop];
        let valueString: string;
        if (value === null || value === undefined) {
          valueString = String(value);
        } else if (typeof value === "object") {
          valueString = JSON.stringify(value, null, 2);
        } else if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          typeof value === "bigint" ||
          typeof value === "symbol"
        ) {
          valueString = String(value);
        } else {
          valueString = JSON.stringify(value, null, 2);
        }
        parts.push(`  ${prop}: ${valueString}`);
      } catch {
        parts.push(`  ${prop}: [unable to stringify]`);
      }
    });
  }

  const errorString = parts.join("");
  if (errorString) {
    return errorString;
  }

  try {
    return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
  } catch {
    return String(err);
  }
}
