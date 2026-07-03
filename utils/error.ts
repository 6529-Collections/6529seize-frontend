function getStringProperty(error: unknown, property: string): string {
  if (typeof error === "object" && error !== null && property in error) {
    const value = (error as Record<string, unknown>)[property];
    return typeof value === "string" ? value : "";
  }

  return "";
}

function getErrorName(error: unknown): string {
  return getStringProperty(error, "name");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return getStringProperty(error, "message");
}

function getErrorCode(error: unknown): string {
  return getStringProperty(error, "code");
}

export function isShareCancelError(error: unknown): boolean {
  if (getErrorName(error) === "AbortError") {
    return true;
  }

  const normalizedDetails = [
    getErrorName(error),
    getErrorMessage(error),
    getErrorCode(error),
  ]
    .join(" ")
    .toLowerCase();

  return /\b(abort(?:ed)?|cancel(?:ed|led)?|dismiss(?:ed)?)\b/.test(
    normalizedDetails
  );
}
