import { getValidatorPageServerEnv } from "@/config/serverEnv";
import { getAwsCredentials } from "./awsCredentials";
import { presignS3GetUrl } from "./sigv4";

/**
 * The private bucket that holds the release feed and the release files. The
 * production role may only read it; nothing in it is public.
 */
const DEFAULT_RELEASES_BUCKET = "6529-validator-releases-e417f844";
const DEFAULT_RELEASES_REGION = "us-east-1";
const FETCH_TIMEOUT_MS = 5_000;
// The feed is a few kilobytes; refuse anything far larger.
const MAX_FEED_OBJECT_BYTES = 1024 * 1024;

export const FEED_OBJECT_KEY = "feed/releases.json";
export const FEED_SIGNATURE_OBJECT_KEY = "feed/releases.json.sig";

export function getReleaseObjectKey(version: string, fileName: string): string {
  return `releases/${version}/${fileName}`;
}

/** A private bucket the servers' role may read. */
export type BucketLocation = {
  readonly bucket: string;
  readonly region: string;
};

function getBucketLocation(): BucketLocation {
  const env = getValidatorPageServerEnv();
  return {
    bucket: env.releasesBucket ?? DEFAULT_RELEASES_BUCKET,
    region: env.releasesRegion ?? DEFAULT_RELEASES_REGION,
  };
}

export type BucketObject =
  | {
      readonly state: "found";
      readonly body: Uint8Array<ArrayBuffer>;
      readonly etag: string | null;
      readonly lastModified: string | null;
    }
  | { readonly state: "missing" }
  | { readonly state: "error"; readonly reason: string };

type PresignOptions = {
  readonly expiresInSeconds: number;
  readonly responseParams?: Readonly<Record<string, string>> | undefined;
};

async function presignObject(
  { bucket, region }: BucketLocation,
  key: string,
  options: PresignOptions
): Promise<string> {
  return presignS3GetUrl({
    bucket,
    region,
    key,
    credentials: await getAwsCredentials(),
    expiresInSeconds: options.expiresInSeconds,
    responseParams: options.responseParams,
  });
}

/** Presigns a short-lived GET for one object in the releases bucket. */
export function presignReleaseObject(
  key: string,
  options: PresignOptions
): Promise<string> {
  return presignObject(getBucketLocation(), key, options);
}

/**
 * Reads one small object from a private bucket. A missing key is `missing`,
 * not an error: the role can list the bucket, so S3 answers 404 for it.
 */
export async function readBucketObject(
  location: BucketLocation,
  key: string
): Promise<BucketObject> {
  try {
    const url = await presignObject(location, key, { expiresInSeconds: 60 });
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (response.status === 404) {
      await response.body?.cancel();
      return { state: "missing" };
    }
    if (!response.ok) {
      await response.body?.cancel();
      return { state: "error", reason: `S3 answered ${response.status}` };
    }
    const body = new Uint8Array(await response.arrayBuffer());
    if (body.byteLength > MAX_FEED_OBJECT_BYTES) {
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

/** Reads one small object from the validator's releases bucket. */
export function readReleaseObject(key: string): Promise<BucketObject> {
  return readBucketObject(getBucketLocation(), key);
}
