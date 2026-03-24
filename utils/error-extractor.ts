import { publicEnv } from "@/config/env";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getOwnStringProperty(
  value: Record<string, unknown>,
  key: string
): string | undefined {
  const property = value[key];
  return typeof property === "string" ? property : undefined;
}

function stringifyUnknownError(err: unknown): string {
  if (typeof err === "string") {
    return err;
  }

  if (isRecord(err)) {
    try {
      return JSON.stringify(err);
    } catch {
      return "Complex error object";
    }
  }

  return String(err);
}

export function extractErrorDetails(err: unknown, context?: string): string {
  if (context && publicEnv.NODE_ENV !== "production") {
    console.error(`[${context}] Full error object:`, err);
    if (err instanceof Error) {
      console.error(`[${context}] Error stack:`, err.stack);
      console.error(
        `[${context}] All properties:`,
        Object.getOwnPropertyNames(err)
      );
    } else if (isRecord(err)) {
      console.error(
        `[${context}] Error stack:`,
        getOwnStringProperty(err, "stack")
      );
      console.error(
        `[${context}] All properties:`,
        Object.getOwnPropertyNames(err)
      );
    }
  }

  if (err instanceof Error && err.stack) {
    return err.stack;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (typeof err === "string") {
    return err;
  }

  if (isRecord(err)) {
    const stack = getOwnStringProperty(err, "stack");
    if (stack) {
      return stack;
    }

    const message = getOwnStringProperty(err, "message");
    if (message) {
      return message;
    }
  }

  return stringifyUnknownError(err);
}
