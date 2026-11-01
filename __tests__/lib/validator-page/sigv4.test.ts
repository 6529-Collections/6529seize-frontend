/** @jest-environment node */
import { encodeRfc3986, presignS3GetUrl } from "@/lib/validator-page/sigv4";

// The example credentials and request from AWS's documentation of query
// string authentication for S3 (Signature Version 4).
const EXAMPLE_CREDENTIALS = {
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
};

describe("presignS3GetUrl", () => {
  it("matches AWS's published presigned GET example", () => {
    const url = presignS3GetUrl({
      bucket: "examplebucket",
      region: "us-east-1",
      key: "test.txt",
      credentials: EXAMPLE_CREDENTIALS,
      expiresInSeconds: 86_400,
      now: new Date("2013-05-24T00:00:00Z"),
      host: "examplebucket.s3.amazonaws.com",
    });
    expect(url).toBe(
      "https://examplebucket.s3.amazonaws.com/test.txt" +
        "?X-Amz-Algorithm=AWS4-HMAC-SHA256" +
        "&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request" +
        "&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host" +
        "&X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404"
    );
  });

  it("uses the regional host, signs the session token and response overrides", () => {
    const url = new URL(
      presignS3GetUrl({
        bucket: "releases-bucket",
        region: "us-east-1",
        key: "releases/0.1.0-test.1/6529-Validator-0.1.0.dmg",
        credentials: {
          ...EXAMPLE_CREDENTIALS,
          sessionToken: "token/with+chars=",
        },
        expiresInSeconds: 300,
        now: new Date("2026-11-01T20:00:00Z"),
        responseParams: {
          "response-content-disposition":
            'attachment; filename="6529-Validator-0.1.0.dmg"',
        },
      })
    );
    expect(url.host).toBe("releases-bucket.s3.us-east-1.amazonaws.com");
    expect(url.pathname).toBe(
      "/releases/0.1.0-test.1/6529-Validator-0.1.0.dmg"
    );
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-Security-Token")).toBe(
      "token/with+chars="
    );
    expect(url.searchParams.get("response-content-disposition")).toBe(
      'attachment; filename="6529-Validator-0.1.0.dmg"'
    );
    expect(url.search).not.toContain("+");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("refuses an expiry S3 does not accept", () => {
    const base = {
      bucket: "b",
      region: "us-east-1",
      key: "k",
      credentials: EXAMPLE_CREDENTIALS,
    };
    expect(() => presignS3GetUrl({ ...base, expiresInSeconds: 0 })).toThrow(
      RangeError
    );
    expect(() =>
      presignS3GetUrl({ ...base, expiresInSeconds: 604_801 })
    ).toThrow(RangeError);
  });
});

describe("encodeRfc3986", () => {
  it("leaves only unreserved characters unencoded", () => {
    expect(encodeRfc3986("a-b_c.d~e")).toBe("a-b_c.d~e");
    expect(encodeRfc3986("!'()* /+=")).toBe("%21%27%28%29%2A%20%2F%2B%3D");
  });
});
