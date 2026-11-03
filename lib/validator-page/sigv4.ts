import { createHash, createHmac } from "node:crypto";

export type AwsCredentials = {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly sessionToken?: string | undefined;
};

type PresignS3GetUrlInput = {
  readonly bucket: string;
  readonly region: string;
  readonly key: string;
  readonly credentials: AwsCredentials;
  readonly expiresInSeconds: number;
  readonly now?: Date | undefined;
  /** Response overrides such as `response-content-disposition`. */
  readonly responseParams?: Readonly<Record<string, string>> | undefined;
  /** Test vectors use the global endpoint; the site uses the regional one. */
  readonly host?: string | undefined;
};

const ALGORITHM = "AWS4-HMAC-SHA256";
const SERVICE = "s3";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
const MAX_EXPIRES_SECONDS = 604_800;

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

/** Percent-encodes as SigV4 requires: only A-Z, a-z, 0-9, `-._~` stay. */
export function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replaceAll(
    /[!'()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`
  );
}

function encodeObjectKey(key: string): string {
  return key.split("/").map(encodeRfc3986).join("/");
}

function toAmzDate(date: Date): { amzDate: string; dateStamp: string } {
  const amzDate = date.toISOString().replaceAll(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

function compareCodeUnits(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

/**
 * Builds a presigned S3 GET URL (AWS Signature Version 4, query
 * authentication). The URL works until `expiresInSeconds` pass or the
 * credentials expire, whichever comes first.
 */
export function presignS3GetUrl({
  bucket,
  region,
  key,
  credentials,
  expiresInSeconds,
  now = new Date(),
  responseParams = {},
  host = `${bucket}.s3.${region}.amazonaws.com`,
}: PresignS3GetUrlInput): string {
  if (
    !Number.isInteger(expiresInSeconds) ||
    expiresInSeconds < 1 ||
    expiresInSeconds > MAX_EXPIRES_SECONDS
  ) {
    throw new RangeError("presign expiry must be 1 to 604800 seconds");
  }
  const { amzDate, dateStamp } = toAmzDate(now);
  const scope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const params: [string, string][] = [
    ["X-Amz-Algorithm", ALGORITHM],
    ["X-Amz-Credential", `${credentials.accessKeyId}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresInSeconds)],
    ["X-Amz-SignedHeaders", "host"],
    ...Object.entries(responseParams),
  ];
  if (credentials.sessionToken) {
    params.push(["X-Amz-Security-Token", credentials.sessionToken]);
  }
  const canonicalQuery = params
    .map(([name, value]): [string, string] => [
      encodeRfc3986(name),
      encodeRfc3986(value),
    ])
    .sort(
      ([nameA, valueA], [nameB, valueB]) =>
        compareCodeUnits(nameA, nameB) || compareCodeUnits(valueA, valueB)
    )
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  const path = `/${encodeObjectKey(key)}`;
  const canonicalRequest = [
    "GET",
    path,
    canonicalQuery,
    `host:${host}\n`,
    "host",
    UNSIGNED_PAYLOAD,
  ].join("\n");
  const stringToSign = [
    ALGORITHM,
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${credentials.secretAccessKey}`, dateStamp), region),
      SERVICE
    ),
    "aws4_request"
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");
  return `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
