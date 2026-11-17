/** @jest-environment node */
import { readAiReleaseObject } from "@/lib/ai-page/releasesBucket";

const S3_ERROR = (code: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<Error><Code>${code}</Code><Message>made up</Message></Error>`;

describe("readAiReleaseObject", () => {
  let fetchSpy: jest.SpyInstance;

  beforeAll(() => {
    process.env["AWS_ACCESS_KEY_ID"] = "test-access-key-id";
    process.env["AWS_SECRET_ACCESS_KEY"] = "test-secret-access-key";
  });

  afterAll(() => {
    delete process.env["AWS_ACCESS_KEY_ID"];
    delete process.env["AWS_SECRET_ACCESS_KEY"];
  });

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("reads an object from 6529 AI's bucket with a presigned GET", async () => {
    fetchSpy.mockResolvedValue(
      new Response("{}", { status: 200, headers: { etag: '"e"' } })
    );
    const result = await readAiReleaseObject("feed/releases.json");
    expect(result).toMatchObject({ state: "found", etag: '"e"' });
    const url = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(url.host).toBe(
      "6529-ai-releases-4d7e988d.s3.us-east-1.amazonaws.com"
    );
    expect(url.pathname).toBe("/feed/releases.json");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("60");
  });

  it("reads S3's 403 AccessDenied as a missing key: the role can't list the bucket", async () => {
    fetchSpy.mockResolvedValue(
      new Response(S3_ERROR("AccessDenied"), { status: 403 })
    );
    expect(await readAiReleaseObject("feed/releases.json")).toEqual({
      state: "missing",
    });
    fetchSpy.mockResolvedValue(new Response("", { status: 404 }));
    expect(await readAiReleaseObject("feed/releases.json")).toEqual({
      state: "missing",
    });
  });

  it.each([
    ["a bad signature", 403, S3_ERROR("SignatureDoesNotMatch")],
    ["an unknown key", 403, S3_ERROR("InvalidAccessKeyId")],
    ["an expired token", 400, S3_ERROR("ExpiredToken")],
    ["a server error", 500, S3_ERROR("InternalError")],
  ])("reads %s as an error", async (_name, status, body) => {
    fetchSpy.mockResolvedValue(new Response(body, { status }));
    expect(await readAiReleaseObject("feed/releases.json")).toMatchObject({
      state: "error",
    });
  });

  it("refuses an object far larger than a feed", async () => {
    fetchSpy.mockResolvedValue(
      new Response(new Uint8Array(256 * 1024 + 1), { status: 200 })
    );
    expect(await readAiReleaseObject("feed/releases.json")).toEqual({
      state: "error",
      reason: "object is too large",
    });
  });

  it("reads a network failure as an error", async () => {
    fetchSpy.mockRejectedValue(new Error("connect ECONNREFUSED"));
    expect(await readAiReleaseObject("feed/releases.json")).toEqual({
      state: "error",
      reason: "connect ECONNREFUSED",
    });
  });
});
