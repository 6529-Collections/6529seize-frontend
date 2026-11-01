import { getAwsEnvironmentCredentials } from "@/config/serverEnv";
import type { AwsCredentials } from "./sigv4";

/**
 * The EC2 instance metadata service (IMDSv2). Elastic Beanstalk instances get
 * short-lived credentials for their instance role here, so the server holds
 * no long-lived AWS keys.
 */
const IMDS_ORIGIN = "http://169.254.169.254";
const IMDS_TIMEOUT_MS = 2_000;
const IMDS_TOKEN_TTL_SECONDS = "300";
// Ask for new credentials well before they expire, so a presigned URL made
// from them stays valid for its full five minutes. EC2 publishes the next
// credentials at least five minutes before the old ones expire; until then
// the same ones come back, so ask again at most once a minute.
const REFRESH_BEFORE_EXPIRY_MS = 15 * 60 * 1000;
const MIN_REFRESH_INTERVAL_MS = 60 * 1000;

type CachedCredentials = {
  readonly credentials: AwsCredentials;
  readonly expiresAt: number;
  readonly refreshAt: number;
};

let cached: CachedCredentials | null = null;
let inFlight: Promise<CachedCredentials> | null = null;

async function imdsText(
  path: string,
  init: RequestInit & { readonly headers: Record<string, string> }
): Promise<string> {
  const response = await fetch(`${IMDS_ORIGIN}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(IMDS_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`instance metadata ${path} answered ${response.status}`);
  }
  return response.text();
}

async function fetchInstanceRoleCredentials(): Promise<CachedCredentials> {
  const token = await imdsText("/latest/api/token", {
    method: "PUT",
    headers: { "X-aws-ec2-metadata-token-ttl-seconds": IMDS_TOKEN_TTL_SECONDS },
  });
  const headers = { "X-aws-ec2-metadata-token": token };
  const roleName = (
    await imdsText("/latest/meta-data/iam/security-credentials/", {
      method: "GET",
      headers,
    })
  )
    .split("\n")[0]
    ?.trim();
  if (!roleName) {
    throw new Error("instance metadata lists no IAM role");
  }
  const document = JSON.parse(
    await imdsText(
      `/latest/meta-data/iam/security-credentials/${encodeURIComponent(roleName)}`,
      { method: "GET", headers }
    )
  ) as Record<string, unknown>;
  const accessKeyId = document["AccessKeyId"];
  const secretAccessKey = document["SecretAccessKey"];
  const sessionToken = document["Token"];
  const expiration = Date.parse(String(document["Expiration"]));
  if (
    typeof accessKeyId !== "string" ||
    typeof secretAccessKey !== "string" ||
    typeof sessionToken !== "string" ||
    !Number.isFinite(expiration)
  ) {
    throw new Error("instance metadata returned incomplete credentials");
  }
  return {
    credentials: { accessKeyId, secretAccessKey, sessionToken },
    expiresAt: expiration,
    refreshAt: Math.max(
      Date.now() + MIN_REFRESH_INTERVAL_MS,
      expiration - REFRESH_BEFORE_EXPIRY_MS
    ),
  };
}

/**
 * Returns AWS credentials: the standard environment variables when set (local
 * development), otherwise the instance role's, cached until shortly before
 * they expire.
 */
export async function getAwsCredentials(): Promise<AwsCredentials> {
  const fromEnvironment = getAwsEnvironmentCredentials();
  if (fromEnvironment) {
    return fromEnvironment;
  }
  if (
    cached &&
    Date.now() < cached.refreshAt &&
    Date.now() < cached.expiresAt
  ) {
    return cached.credentials;
  }
  inFlight ??= fetchInstanceRoleCredentials().finally(() => {
    inFlight = null;
  });
  try {
    cached = await inFlight;
  } catch (error) {
    // Credentials that have not expired yet still sign valid requests.
    if (cached && cached.expiresAt > Date.now()) {
      return cached.credentials;
    }
    throw error;
  }
  return cached.credentials;
}

/** Test hook: forget cached instance-role credentials. */
export function resetAwsCredentialsCacheForTests(): void {
  cached = null;
  inFlight = null;
}
