import type { TweetPreview } from "@/lib/twitter";

interface TwitterPreviewErrorBody {
  readonly error: string;
}

const TWITTER_PREVIEW_TIMEOUT_MS = 10_000;

const hasErrorMessage = (value: unknown): value is TwitterPreviewErrorBody => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof (value as Record<string, unknown>)["error"] === "string";
};

const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { readonly name?: unknown }).name === "AbortError";

const readTwitterPreviewError = async (
  response: Response,
  fallbackMessage: string
): Promise<Error> => {
  try {
    const body: unknown = await response.json();
    if (hasErrorMessage(body)) {
      return new Error(body.error);
    }
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }
  }

  return new Error(fallbackMessage);
};

export async function fetchTwitterPreview(url: string): Promise<TweetPreview> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => {
    controller.abort();
  }, TWITTER_PREVIEW_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({ url });
    const response = await fetch(`/api/twitter/preview?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await readTwitterPreviewError(
        response,
        "Failed to fetch Twitter/X preview metadata."
      );
    }

    return (await response.json()) as TweetPreview;
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error(
        "Failed to fetch Twitter/X preview metadata. Request timed out."
      );
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
