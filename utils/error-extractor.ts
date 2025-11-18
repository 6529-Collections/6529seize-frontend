export function extractErrorDetails(
  err: Error & { digest?: string },
  context?: string
): string {
  if (context) {
    console.error(`[${context}] Full error object:`, err);
    console.error(`[${context}] Error stack:`, err.stack);
    console.error(
      `[${context}] All properties:`,
      Object.getOwnPropertyNames(err)
    );
  }

  const parts: string[] = [];

  if (err.message) {
    parts.push(`Message: ${err.message}`);
  }

  if (err.stack) {
    parts.push(`\n\nStack Trace:\n${err.stack}`);
  }

  if (err.name) {
    parts.push(`\n\nError Name: ${err.name}`);
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

  if (err.digest) {
    parts.push(`\n\nDigest: ${err.digest}`);
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
