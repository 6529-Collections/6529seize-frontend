/** @jest-environment node */
import { readBucketObject } from "@/lib/validator-page/releasesBucket";

const LOCATION = { bucket: "desktop-releases.example", region: "eu-west-1" };
const ENV_NAMES = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"];

describe("readBucketObject", () => {
  const savedEnv = Object.fromEntries(
    ENV_NAMES.map((name) => [name, process.env[name]])
  );

  beforeEach(() => {
    process.env["AWS_ACCESS_KEY_ID"] = "AKIDEXAMPLE";
    process.env["AWS_SECRET_ACCESS_KEY"] = "test-secret";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const name of ENV_NAMES) {
      if (savedEnv[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = savedEnv[name];
      }
    }
  });

  it("reads the object from the given bucket and region", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { etag: '"e"', "last-modified": "Sat, 14 Nov 2026" },
      })
    );

    const object = await readBucketObject(LOCATION, "feed/releases.json");

    expect(object).toEqual({
      state: "found",
      body: new TextEncoder().encode("{}"),
      etag: '"e"',
      lastModified: "Sat, 14 Nov 2026",
    });
    const url = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(url.host).toBe("desktop-releases.example.s3.eu-west-1.amazonaws.com");
    expect(url.pathname).toBe("/feed/releases.json");
  });

  it("reports a missing key as missing and other failures as errors", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(readBucketObject(LOCATION, "a")).resolves.toEqual({
      state: "missing",
    });
    await expect(readBucketObject(LOCATION, "a")).resolves.toEqual({
      state: "error",
      reason: "S3 answered 403",
    });
  });
});
