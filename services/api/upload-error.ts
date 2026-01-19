import type { AxiosError } from "axios";

const NETWORK_HINT =
  "Can't reach image upload server. Please try again.";
const BLOCKED_HINT =
  "Upload was blocked by the server (403). Please try again later.";
const TOO_LARGE_HINT = "Image is too large; max 2MB.";
const FALLBACK_HINT = "Upload failed. Please try again.";

function isAxiosError(error: unknown): error is AxiosError {
  return Boolean((error as AxiosError | undefined)?.isAxiosError);
}

function messageFromUnknown(error: unknown): string | null {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return null;
}

export function getUploadErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (!error.response) {
      return NETWORK_HINT;
    }

    if (status === 403) return BLOCKED_HINT;
    if (status === 413) return TOO_LARGE_HINT;

    const serverMsg =
      (typeof error.response?.data === "object" &&
        (error.response?.data as any)?.error) ||
      messageFromUnknown(error);

    return serverMsg ?? FALLBACK_HINT;
  }

  const msg = messageFromUnknown(error);
  const normalized = msg?.toLowerCase() ?? "";

  if (
    normalized.includes("network request failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("load failed") ||
    normalized.includes("network error")
  ) {
    return NETWORK_HINT;
  }

  return msg ?? FALLBACK_HINT;
}
