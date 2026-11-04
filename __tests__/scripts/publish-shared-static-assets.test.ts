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
  runWithConcurrency,
} = require("../../ops/scripts/publish-shared-static-assets.cjs");

const BUCKET = "seize-web";
const PREFIX = "web_build/shared/_next/static";
const BUILD_ID = "a".repeat(40);

type AwsResult = { code: number; stdout: string; stderr: string };
type Stored = { size: number; sha256?: string };

const sha256 = (content: string | Buffer) =>
  createHash("sha256").update(content).digest("base64");
const ok = (body: unknown): AwsResult => ({
  code: 0,
  stdout: JSON.stringify(body),
  stderr: "",
});
const preconditionFailed: AwsResult = {
  code: 254,
  stdout: "",
  stderr:
    "An error occurred (PreconditionFailed) when calling the PutObject operation",
};
const storedFor = (content: string): Stored => ({
  size: Buffer.byteLength(content),
  sha256: sha256(content),
});
const compare = (a: string, b: string) => {
  if (a < b) return -1;
  return a > b ? 1 : 0;
};

const FILES: Record<string, string> = {
  "chunks/00ieasdvpo4ki.js": "console.log('shared');",
  "chunks/0200ktct53i0m.js": "console.log('changed');",
  "chunks/0a1b2c3d4e5f6.css": "body{color:red}",
  "media/Montserrat-s.p.3s2s_7pxl2s0_.woff2": "wOF2",
  [`${BUILD_ID}/_buildManifest.js`]: "self.__BUILD_MANIFEST={}",
};
const SORTED_PATHS = Object.keys(FILES).sort(compare);

let root: string;

function writeFiles(files: Record<string, string>) {
  for (const [relativePath, content] of Object.entries(files)) {
    const absolute = path.join(root, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
  }
}

function argValue(args: string[], name: string): string {
  const index = args.indexOf(name);
  if (index === -1) throw new Error(`missing ${name}`);
  return args[index + 1]!;
}

// A fake S3 prefix keyed by path relative to PREFIX.
function fakeAws({
  stored = {} as Record<string, Stored>,
  put,
  list,
}: {
  stored?: Record<string, Stored>;
  put?: (key: string, args: string[]) => AwsResult;
  list?: () => AwsResult;
} = {}) {
  const objects = new Map(
    Object.entries(stored).map(([name, value]) => [`${PREFIX}/${name}`, value])
  );
  const calls: string[][] = [];
  const runAws = jest.fn(async (args: string[]) => {
    calls.push(args);
    switch (args[1]) {
      case "list-objects-v2": {
        if (list) return list();
        const contents = [...objects].map(([key, value]) => ({
          key,
          size: value.size,
        }));
        return ok(contents.length > 0 ? contents : null);
      }
      case "head-object": {
        const value = objects.get(argValue(args, "--key"));
        return value
          ? ok({ ContentLength: value.size, ChecksumSHA256: value.sha256 })
          : { code: 254, stdout: "", stderr: "Not Found" };
      }
      case "put-object": {
        const key = argValue(args, "--key");
        if (put) return put(key, args);
        if (objects.has(key)) return preconditionFailed;
        const body = fs.readFileSync(argValue(args, "--body"));
        objects.set(key, { size: body.length, sha256: sha256(body) });
        return ok({ ChecksumSHA256: sha256(body) });
      }
      default:
        throw new Error(`unexpected aws call: ${args.join(" ")}`);
    }
  });
  const of = (operation: string) =>
    calls.filter((args) => args[1] === operation);
  return { runAws, calls, of };
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
    expect(contentTypeFor("chunks/a.css")).toBe("text/css");
    expect(contentTypeFor("media/a.woff2")).toBe("font/woff2");
    expect(contentTypeFor("media/a.ttf")).toBe("font/ttf");
    expect(contentTypeFor("media/a.SVG")).toBe("image/svg+xml");
    expect(contentTypeFor("chunks/a.unknown")).toBeNull();
    expect(contentTypeFor("chunks/a.constructor")).toBeNull();
  });

  it("inventories files in code-point order with their shared keys and SHA-256", () => {
    const inventory = buildLocalInventory(root, PREFIX);

    expect(inventory.map((file: { key: string }) => file.key)).toEqual(
      SORTED_PATHS.map((relativePath) => `${PREFIX}/${relativePath}`)
    );
    expect(
      inventory.find(
        (file: { relativePath: string }) =>
          file.relativePath === "chunks/00ieasdvpo4ki.js"
      )
    ).toEqual(
      expect.objectContaining({
        size: Buffer.byteLength(FILES["chunks/00ieasdvpo4ki.js"]!),
        sha256: sha256(FILES["chunks/00ieasdvpo4ki.js"]!),
        contentType: "text/javascript",
      })
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

  it("plans new names for upload, same-size names for checksum checks, and other sizes as collisions", () => {
    const inventory = buildLocalInventory(root, PREFIX);
    const plan = planPublication(inventory, [
      {
        key: `${PREFIX}/chunks/00ieasdvpo4ki.js`,
        size: Buffer.byteLength(FILES["chunks/00ieasdvpo4ki.js"]!),
      },
      { key: `${PREFIX}/chunks/0200ktct53i0m.js`, size: 1 },
    ]);

    const keys = (files: { key: string }[]) => files.map((file) => file.key);
    expect(keys(plan.verify)).toEqual([`${PREFIX}/chunks/00ieasdvpo4ki.js`]);
    expect(
      plan.collisions.map(({ file }: { file: { key: string } }) => file.key)
    ).toEqual([`${PREFIX}/chunks/0200ktct53i0m.js`]);
    expect(keys(plan.upload)).toEqual([
      `${PREFIX}/${BUILD_ID}/_buildManifest.js`,
      `${PREFIX}/chunks/0a1b2c3d4e5f6.css`,
      `${PREFIX}/media/Montserrat-s.p.3s2s_7pxl2s0_.woff2`,
    ]);
  });

  it("lists the whole prefix, relying on the CLI's default pagination", async () => {
    const aws = fakeAws();

    await publish(aws.runAws);

    // S3 pages ListObjectsV2 at 1,000 keys. The CLI follows every page unless
    // one of these flags is passed, so the listing must never pass them.
    const [listCall] = aws.of("list-objects-v2");
    expect(listCall).toEqual([
      "s3api",
      "list-objects-v2",
      "--bucket",
      BUCKET,
      "--prefix",
      `${PREFIX}/`,
      "--query",
      "Contents[].{key: Key, size: Size}",
      "--output",
      "json",
    ]);
    for (const flag of [
      "--no-paginate",
      "--max-items",
      "--page-size",
      "--starting-token",
    ]) {
      expect(listCall).not.toContain(flag);
    }
  });

  it("uploads every file create-only with its SHA-256 on the first publication", async () => {
    const aws = fakeAws();

    const evidence = await publish(aws.runAws, { concurrency: 2 });

    expect(aws.of("head-object")).toHaveLength(0);
    expect(aws.of("put-object")).toHaveLength(SORTED_PATHS.length);
    const chunkPut = aws
      .of("put-object")
      .find(
        (args) => argValue(args, "--key") === `${PREFIX}/chunks/00ieasdvpo4ki.js`
      )!;
    expect(argValue(chunkPut, "--bucket")).toBe(BUCKET);
    expect(argValue(chunkPut, "--if-none-match")).toBe("*");
    expect(argValue(chunkPut, "--cache-control")).toBe(IMMUTABLE_CACHE_CONTROL);
    expect(IMMUTABLE_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
    expect(argValue(chunkPut, "--content-type")).toBe("text/javascript");
    expect(argValue(chunkPut, "--checksum-algorithm")).toBe("SHA256");
    expect(argValue(chunkPut, "--checksum-sha256")).toBe(
      sha256(FILES["chunks/00ieasdvpo4ki.js"]!)
    );
    expect(chunkPut.join(" ")).not.toMatch(/md5/i);
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
    expect(evidence.uploaded_paths).toEqual(SORTED_PATHS);
  });

  it("uploads only names the prefix lacks after checking stored checksums", async () => {
    const unchanged = [
      "chunks/00ieasdvpo4ki.js",
      "chunks/0a1b2c3d4e5f6.css",
      "media/Montserrat-s.p.3s2s_7pxl2s0_.woff2",
    ];
    const aws = fakeAws({
      stored: {
        ...Object.fromEntries(
          unchanged.map((name) => [name, storedFor(FILES[name]!)])
        ),
        "chunks/zz-from-an-older-build.js": storedFor("old"),
      },
    });

    const evidence = await publish(aws.runAws);

    const head = aws.of("head-object");
    expect(head.map((args) => argValue(args, "--key")).sort(compare)).toEqual(
      unchanged.map((name) => `${PREFIX}/${name}`)
    );
    expect(argValue(head[0]!, "--checksum-mode")).toBe("ENABLED");
    expect(
      aws
        .of("put-object")
        .map((args) => argValue(args, "--key"))
        .sort(compare)
    ).toEqual([
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

  // "console.log('changed');" is 23 bytes.
  it.each<[string, Stored]>([
    ["different bytes of the same size", { size: 23, sha256: sha256("y".repeat(23)) }],
    ["a different size", { size: 3, sha256: sha256("old") }],
    ["no stored SHA-256", { size: 23 }],
  ])("writes nothing when an existing name holds %s", async (_, stored) => {
    expect(Buffer.byteLength(FILES["chunks/0200ktct53i0m.js"]!)).toBe(23);
    const aws = fakeAws({ stored: { "chunks/0200ktct53i0m.js": stored } });

    await expect(publish(aws.runAws)).rejects.toThrow(
      /refusing to publish: 1 static file name\(s\) already exist with different bytes[\s\S]*chunks\/0200ktct53i0m\.js/
    );
    expect(aws.of("put-object")).toHaveLength(0);
  });

  // Another writer stores the name between the listing and the upload, so the
  // upload gets 412 and head-object sees the other writer's object.
  function racingAws(racedName: string, racedObject: Stored) {
    const racedKey = `${PREFIX}/${racedName}`;
    return jest.fn(async (args: string[]): Promise<AwsResult> => {
      if (args[1] === "list-objects-v2") return ok(null);
      if (args[1] === "head-object") {
        return ok({
          ContentLength: racedObject.size,
          ChecksumSHA256: racedObject.sha256,
        });
      }
      if (argValue(args, "--key") === racedKey) return preconditionFailed;
      const body = fs.readFileSync(argValue(args, "--body"));
      return ok({ ChecksumSHA256: sha256(body) });
    });
  }

  it("accepts identical bytes stored by a concurrent writer after the listing", async () => {
    const name = "chunks/00ieasdvpo4ki.js";

    const evidence = await publish(racingAws(name, storedFor(FILES[name]!)));

    expect(evidence.uploaded.files).toBe(4);
    expect(evidence.reused.files).toBe(1);
    expect(evidence.uploaded_paths).not.toContain(name);
  });

  it("fails when a concurrent writer stored different bytes under the name", async () => {
    await expect(
      publish(racingAws("chunks/00ieasdvpo4ki.js", storedFor("other")), {
        concurrency: 1,
      })
    ).rejects.toThrow("already exist with different bytes");
  });

  it("fails on listing, upload, and stored-checksum errors", async () => {
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
      publish(fakeAws({ put: () => ok({ ChecksumSHA256: sha256("other") }) }).runAws, {
        concurrency: 1,
      })
    ).rejects.toThrow("does not match the verified file");
  });

  it("stops starting new uploads after the first failure", async () => {
    const started: number[] = [];
    const worker = async (item: number) => {
      started.push(item);
      if (item === 1) throw new Error("upload 1 failed");
      await new Promise((resolve) => setTimeout(resolve, 5));
      return item;
    };

    await expect(
      runWithConcurrency([0, 1, 2, 3, 4, 5], 2, worker)
    ).rejects.toThrow("upload 1 failed");
    // Items 0 and 1 start together; 1 fails while 0 is still running, so
    // 0 finishes and nothing after them starts.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(started).toEqual([0, 1]);

    await expect(runWithConcurrency([0, 1, 2], 1, worker)).rejects.toThrow(
      "upload 1 failed"
    );
    await expect(runWithConcurrency([3, 4, 5], 2, worker)).resolves.toEqual([
      3, 4, 5,
    ]);
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
