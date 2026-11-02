import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  IMMUTABLE_CACHE_CONTROL,
  buildLocalInventory,
  contentTypeFor,
  planPublication,
  publishSharedStaticAssets,
} = require("../../ops/scripts/publish-shared-static-assets.cjs");

const BUCKET = "seize-web";
const PREFIX = "web_build/shared/_next/static";
const BUILD_ID = "a".repeat(40);

type AwsResult = { code: number; stdout: string; stderr: string };
type RemoteObject = { key: string; etag: string; size: number };

const md5 = (content: string) =>
  createHash("md5").update(content).digest("hex");
const ok = (body: unknown): AwsResult => ({
  code: 0,
  stdout: JSON.stringify(body),
  stderr: "",
});
const stored = (relativePath: string, content: string): RemoteObject => ({
  key: `${PREFIX}/${relativePath}`,
  etag: `"${md5(content)}"`,
  size: Buffer.byteLength(content),
});

const FILES: Record<string, string> = {
  "chunks/00ieasdvpo4ki.js": "console.log('shared');",
  "chunks/0200ktct53i0m.js": "console.log('changed');",
  "css/0a1b2c3d4e5f6.css": "body{color:red}",
  "media/Montserrat-s.p.3s2s_7pxl2s0_.woff2": "wOF2",
  [`${BUILD_ID}/_buildManifest.js`]: "self.__BUILD_MANIFEST={}",
};

let root: string;

function writeFiles(files: Record<string, string>) {
  for (const [relativePath, content] of Object.entries(files)) {
    const absolute = path.join(root, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
  }
}

function fakeAws({
  listed = null as RemoteObject[] | null,
  put = (_key: string, args: string[]): AwsResult =>
    ok({ ETag: `"${md5(fs.readFileSync(argValue(args, "--body"), "utf8"))}"` }),
  head = (_key: string): AwsResult => ({ code: 254, stdout: "", stderr: "" }),
  list = (): AwsResult => ok(listed),
} = {}) {
  const calls: string[][] = [];
  const runAws = jest.fn(async (args: string[]) => {
    calls.push(args);
    switch (args[1]) {
      case "list-objects-v2":
        return list();
      case "put-object":
        return put(argValue(args, "--key"), args);
      case "head-object":
        return head(argValue(args, "--key"));
      default:
        throw new Error(`unexpected aws call: ${args.join(" ")}`);
    }
  });
  const puts = () => calls.filter((args) => args[1] === "put-object");
  return { runAws, calls, puts };
}

function argValue(args: string[], name: string): string {
  const index = args.indexOf(name);
  if (index === -1) throw new Error(`missing ${name}`);
  return args[index + 1]!;
}

function publish(runAws: unknown, options: Record<string, unknown> = {}) {
  return publishSharedStaticAssets({
    source: root,
    bucket: BUCKET,
    prefix: PREFIX,
    runAws,
    ...options,
  });
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "shared-static-"));
  writeFiles(FILES);
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("publish-shared-static-assets", () => {
  it("serves each static file type with the Content-Type the per-commit uploads used", () => {
    expect(contentTypeFor("chunks/a.js")).toBe("text/javascript");
    expect(contentTypeFor("css/a.css")).toBe("text/css");
    expect(contentTypeFor("media/a.woff2")).toBe("font/woff2");
    expect(contentTypeFor("media/a.SVG")).toBe("image/svg+xml");
    expect(contentTypeFor("chunks/a.unknown")).toBeNull();
    expect(contentTypeFor("chunks/constructor")).toBeNull();
  });

  it("inventories files with their shared keys and MD5 digests", () => {
    const inventory = buildLocalInventory(root, PREFIX);

    expect(inventory.map((file: { key: string }) => file.key)).toEqual(
      Object.keys(FILES)
        .sort()
        .map((relativePath) => `${PREFIX}/${relativePath}`)
    );
    const chunk = inventory.find(
      (file: { relativePath: string }) =>
        file.relativePath === "chunks/00ieasdvpo4ki.js"
    );
    expect(chunk).toEqual(
      expect.objectContaining({
        size: Buffer.byteLength(FILES["chunks/00ieasdvpo4ki.js"]!),
        md5Hex: md5(FILES["chunks/00ieasdvpo4ki.js"]!),
        contentType: "text/javascript",
      })
    );
    expect(Buffer.from(chunk.md5Base64, "base64").toString("hex")).toBe(
      chunk.md5Hex
    );
  });

  it("fails closed on file types without a defined Content-Type", () => {
    writeFiles({ "chunks/runtime.bin": "x" });
    expect(() => buildLocalInventory(root, PREFIX)).toThrow(
      "no Content-Type is defined for: .bin"
    );
  });

  it("refuses an empty source", () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "shared-static-empty-"));
    try {
      expect(() => buildLocalInventory(empty, PREFIX)).toThrow(
        "--source contains no files"
      );
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });

  it("plans new names for upload, identical names for reuse, and other bytes as collisions", () => {
    const inventory = buildLocalInventory(root, PREFIX);
    const plan = planPublication(inventory, [
      stored("chunks/00ieasdvpo4ki.js", FILES["chunks/00ieasdvpo4ki.js"]!),
      stored("chunks/0200ktct53i0m.js", "different bytes"),
      // A multipart ETag cannot be compared with an MD5, so it never counts as
      // the same object.
      {
        key: `${PREFIX}/css/0a1b2c3d4e5f6.css`,
        etag: `"${md5(FILES["css/0a1b2c3d4e5f6.css"]!)}-2"`,
        size: Buffer.byteLength(FILES["css/0a1b2c3d4e5f6.css"]!),
      },
    ]);

    const keys = (files: { key: string }[]) => files.map((file) => file.key);
    expect(keys(plan.reuse)).toEqual([`${PREFIX}/chunks/00ieasdvpo4ki.js`]);
    expect(
      plan.collisions.map(({ file }: { file: { key: string } }) => file.key)
    ).toEqual([
      `${PREFIX}/chunks/0200ktct53i0m.js`,
      `${PREFIX}/css/0a1b2c3d4e5f6.css`,
    ]);
    expect(keys(plan.upload)).toEqual([
      `${PREFIX}/${BUILD_ID}/_buildManifest.js`,
      `${PREFIX}/media/Montserrat-s.p.3s2s_7pxl2s0_.woff2`,
    ]);
  });

  it("uploads every file create-only on the first publication", async () => {
    const aws = fakeAws({ listed: null });

    const evidence = await publish(aws.runAws, { concurrency: 2 });

    expect(aws.calls[0]).toEqual([
      "s3api",
      "list-objects-v2",
      "--bucket",
      BUCKET,
      "--prefix",
      `${PREFIX}/`,
      "--query",
      "Contents[].{key: Key, etag: ETag, size: Size}",
      "--output",
      "json",
    ]);
    expect(aws.puts()).toHaveLength(Object.keys(FILES).length);
    const chunkPut = aws
      .puts()
      .find(
        (args) => argValue(args, "--key") === `${PREFIX}/chunks/00ieasdvpo4ki.js`
      )!;
    expect(argValue(chunkPut, "--bucket")).toBe(BUCKET);
    expect(argValue(chunkPut, "--if-none-match")).toBe("*");
    expect(argValue(chunkPut, "--cache-control")).toBe(IMMUTABLE_CACHE_CONTROL);
    expect(IMMUTABLE_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
    expect(argValue(chunkPut, "--content-type")).toBe("text/javascript");
    expect(
      Buffer.from(argValue(chunkPut, "--content-md5"), "base64").toString("hex")
    ).toBe(md5(FILES["chunks/00ieasdvpo4ki.js"]!));
    expect(evidence).toEqual(
      expect.objectContaining({
        schema_version: "shared-static-publication.v1",
        bucket: BUCKET,
        prefix: PREFIX,
        remote_objects_listed: 0,
        files: 5,
        uploaded: expect.objectContaining({ files: 5 }),
        reused: { files: 0, bytes: 0 },
      })
    );
    expect(evidence.uploaded_paths).toEqual(Object.keys(FILES).sort());
  });

  it("uploads only names the prefix does not already hold", async () => {
    const unchanged = [
      "chunks/00ieasdvpo4ki.js",
      "css/0a1b2c3d4e5f6.css",
      "media/Montserrat-s.p.3s2s_7pxl2s0_.woff2",
    ];
    const aws = fakeAws({
      listed: [
        ...unchanged.map((name) => stored(name, FILES[name]!)),
        stored("chunks/zz-from-an-older-build.js", "old"),
      ],
    });

    const evidence = await publish(aws.runAws);

    expect(aws.puts().map((args) => argValue(args, "--key")).sort()).toEqual([
      `${PREFIX}/${BUILD_ID}/_buildManifest.js`,
      `${PREFIX}/chunks/0200ktct53i0m.js`,
    ]);
    expect(evidence.remote_objects_listed).toBe(4);
    expect(evidence.reused.files).toBe(3);
    expect(evidence.reused.bytes).toBe(
      unchanged.reduce((total, name) => total + Buffer.byteLength(FILES[name]!), 0)
    );
    expect(evidence.uploaded.files).toBe(2);
    expect(evidence.bytes).toBe(evidence.reused.bytes + evidence.uploaded.bytes);
  });

  it("writes nothing when an existing name holds different bytes", async () => {
    const aws = fakeAws({
      listed: [stored("chunks/0200ktct53i0m.js", "bytes from another build")],
    });

    await expect(publish(aws.runAws)).rejects.toThrow(
      /refusing to publish: 1 static file name\(s\) already exist with different bytes[\s\S]*chunks\/0200ktct53i0m\.js/
    );
    expect(aws.puts()).toHaveLength(0);
  });

  it("accepts identical bytes stored by a concurrent writer after the listing", async () => {
    const aws = fakeAws({
      put: (key, args) =>
        key.endsWith("00ieasdvpo4ki.js")
          ? {
              code: 254,
              stdout: "",
              stderr:
                "An error occurred (PreconditionFailed) when calling the PutObject operation",
            }
          : ok({ ETag: `"${md5(fs.readFileSync(argValue(args, "--body"), "utf8"))}"` }),
      head: () =>
        ok({
          ETag: `"${md5(FILES["chunks/00ieasdvpo4ki.js"]!)}"`,
          ContentLength: Buffer.byteLength(FILES["chunks/00ieasdvpo4ki.js"]!),
        }),
    });

    const evidence = await publish(aws.runAws);

    expect(evidence.uploaded.files).toBe(4);
    expect(evidence.reused.files).toBe(1);
    expect(evidence.uploaded_paths).not.toContain("chunks/00ieasdvpo4ki.js");
  });

  it("fails when a concurrent writer stored different bytes under the name", async () => {
    const aws = fakeAws({
      put: () => ({
        code: 254,
        stdout: "",
        stderr: "An error occurred (PreconditionFailed) when calling the PutObject operation",
      }),
      head: () => ok({ ETag: `"${md5("other")}"`, ContentLength: 5 }),
    });

    await expect(publish(aws.runAws, { concurrency: 1 })).rejects.toThrow(
      "already exist with different bytes"
    );
  });

  it("fails on listing, upload, and stored-digest errors", async () => {
    await expect(
      publish(
        fakeAws({
          list: () => ({ code: 254, stdout: "", stderr: "AccessDenied" }),
        }).runAws
      )
    ).rejects.toThrow(`listing s3://${BUCKET}/${PREFIX}/ failed: AccessDenied`);

    await expect(
      publish(
        fakeAws({ put: () => ({ code: 254, stdout: "", stderr: "AccessDenied" }) })
          .runAws,
        { concurrency: 1 }
      )
    ).rejects.toThrow("failed: AccessDenied");

    await expect(
      publish(fakeAws({ put: () => ok({ ETag: `"${md5("other")}"` }) }).runAws, {
        concurrency: 1,
      })
    ).rejects.toThrow("does not match its MD5");
  });

  it("validates the bucket, prefix, and concurrency before calling AWS", async () => {
    const aws = fakeAws();
    await expect(publish(aws.runAws, { bucket: "Bad_Bucket" })).rejects.toThrow(
      "invalid S3 bucket name"
    );
    await expect(
      publish(aws.runAws, { prefix: "web_build/../_next/static" })
    ).rejects.toThrow("unsafe path segment");
    await expect(publish(aws.runAws, { prefix: "/web_build/shared" })).rejects.toThrow(
      "unsafe path segment"
    );
    await expect(publish(aws.runAws, { concurrency: 0 })).rejects.toThrow(
      "--concurrency must be an integer"
    );
    expect(aws.runAws).not.toHaveBeenCalled();
  });
});
