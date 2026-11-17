import { getAwsCredentials } from "@/lib/validator-page/awsCredentials";
import { presignS3GetUrl } from "@/lib/validator-page/sigv4";

/**
 * The private bucket that holds 6529 AI's release feed and release files.
 * The production instance role may read `feed/*` and `releases/*` and
 * nothing else; nothing in the bucket is public.
 */
const AI_RELEASES_BUCKET = "6529-ai-releases-4d7e988d";
const AI_RELEASES_REGION = "us-east-1";
const FETCH_TIMEOUT_MS = 5_000;
// The feed is at most 64 KiB and its signature under 1 KiB; refuse
// anything far larger before reading it into memory.
const MAX_OBJECT_BYTES = 256 * 1024;

export const AI_FEED_OBJECT_KEY = "feed/releases.json";
export const AI_FEED_SIGNATURE_OBJECT_KEY = "feed/releases.json.sig";

export function getAiReleaseObjectKey(
  version: string,
  fileName: string
): string {
  return `releases/${version}/${fileName}`;
}

export type AiBucketObject =
  | {
      readonly state: "found";
      readonly body: Uint8Array<ArrayBuffer>;
      readonly etag: string | null;
      readonly lastModified: string | null;
    }
  | { readonly state: "missing" }
  | { readonly state: "error"; readonly reason: string };

/** Presigns a short-lived GET for one object in the bucket. */
export async function presignAiReleaseObject(
  key: string,
  options: {
    readonly expiresInSeconds: number;
    readonly responseParams?: Readonly<Record<string, string>> | undefined;
  }
): Promise<string> {
  return presignS3GetUrl({
    bucket: AI_RELEASES_BUCKET,
    region: AI_RELEASES_REGION,
    key,
    credentials: await getAwsCredentials(),
    expiresInSeconds: options.expiresInSeconds,
    responseParams: options.responseParams,
  });
}

/**
 * S3's error code from the XML body of a failed request, such as
 * `AccessDenied` or `SignatureDoesNotMatch`.
 */
async function errorCodeOf(response: Response): Promise<string | null> {
  try {
    const text = (await response.text()).slice(0, 4096);
    return /<Code>([A-Za-z]+)<\/Code>/.exec(text)?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Reads one small object. The role may not list the bucket, so S3 answers
 * a key that isn't there with 403 `AccessDenied`, not 404. That answer and
 * a 404 both read as `missing`: before the first feed is uploaded the pages
 * say there is no release yet. Any other failure is an `error`.
 */
export async function readAiReleaseObject(
  key: string
): Promise<AiBucketObject> {
  try {
    const url = await presignAiReleaseObject(key, { expiresInSeconds: 60 });
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (response.status === 404) {
      await response.body?.cancel();
      return { state: "missing" };
    }
    if (response.status === 403) {
      const code = await errorCodeOf(response);
      return code === "AccessDenied"
        ? { state: "missing" }
        : { state: "error", reason: `S3 answered 403 ${code ?? ""}`.trim() };
    }
    if (!response.ok) {
      await response.body?.cancel();
      return { state: "error", reason: `S3 answered ${response.status}` };
    }
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_OBJECT_BYTES) {
      await response.body?.cancel();
      return { state: "error", reason: "object is too large" };
    }
    const body = new Uint8Array(await response.arrayBuffer());
    if (body.byteLength > MAX_OBJECT_BYTES) {
      return { state: "error", reason: "object is too large" };
    }
    return {
      state: "found",
      body,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    };
  } catch (error) {
    return {
      state: "error",
      reason: error instanceof Error ? error.message : "unknown error",
    };
  }
}
