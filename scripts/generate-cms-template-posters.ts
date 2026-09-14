/**
 * Rebuild: seize exec tsx scripts/generate-cms-template-posters.ts --write
 * Verify checked-in outputs: seize exec tsx scripts/generate-cms-template-posters.ts --check
 * No source media are persisted. Originals remain the signed package assets.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import {
  CMS_STUDIO_MEME_WORKS,
  type CmsStudioMemeWork,
} from "../lib/profile-cms/studio/meme-assets";

const REPO_ROOT = process.cwd();
const PUBLIC_DIRECTORY = "profile-cms/templates/memes";
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "lib/profile-cms/studio/meme-display-assets.json"
);
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 1024 * 1024;
const MAX_EDGE = 1440;
const TRANSFORM = {
  revision: 1,
  frame: 0,
  auto_orient: true,
  fit: "inside",
  max_width: MAX_EDGE,
  max_height: MAX_EDGE,
  without_enlargement: true,
  kernel: "lanczos3",
  format: "webp",
  quality: 82,
  alpha_quality: 100,
  effort: 6,
  smart_subsample: true,
};

function hash(bytes: Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function assertSourceUrl(url: URL, transactionId: string): void {
  assert.equal(url.protocol, "https:");
  assert.equal(
    url.username + url.password + url.port + url.search + url.hash,
    ""
  );
  assert.equal(url.pathname, `/${transactionId}`);
  assert.ok(
    url.hostname === "arweave.net" ||
      /^[a-z2-7]{52}\.arweave\.net$/.test(url.hostname)
  );
}

async function readBoundedBody(response: Response): Promise<Buffer> {
  assert.ok(response.body, "Missing source media body");
  const chunks: Buffer[] = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      assert.ok(size <= MAX_ORIGINAL_BYTES, "Source media exceeds 25MiB limit");
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

async function loadVerifiedOriginal(work: CmsStudioMemeWork): Promise<Buffer> {
  let url = new URL(work.asset.uri);
  const transactionId = url.pathname.slice(1);
  assert.match(transactionId, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(url.hostname, "arweave.net");
  const signal = AbortSignal.timeout(30_000);
  for (let redirects = 0; redirects <= 2; redirects += 1) {
    assertSourceUrl(url, transactionId);
    const response = await fetch(url, { redirect: "manual", signal });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get("location");
      assert.ok(location, "Missing media redirect target");
      url = new URL(location, url);
      continue;
    }
    assert.equal(
      response.status,
      200,
      `Meme ${work.cardId} original unavailable`
    );
    const bytes = await readBoundedBody(response);
    assert.equal(
      bytes.length,
      work.asset.file_size_bytes,
      `Meme ${work.cardId} byte size mismatch`
    );
    assert.equal(
      hash(bytes),
      work.asset.content_hash,
      `Meme ${work.cardId} original hash mismatch`
    );
    return bytes;
  }
  throw new Error(`Meme ${work.cardId} exceeded media redirect limit`);
}

async function buildPreview(work: CmsStudioMemeWork) {
  const original = await loadVerifiedOriginal(work);
  const input = sharp(original, {
    page: 0,
    pages: 1,
    animated: false,
    limitInputPixels: 40_000_000,
  });
  const source = await input.metadata();
  assert.equal(source.width, work.asset.width);
  assert.equal(source.pageHeight ?? source.height, work.asset.height);
  const { data, info } = await input
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality: 82, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
  assert.ok(
    data.length <= MAX_PREVIEW_BYTES,
    `Meme ${work.cardId} preview exceeds 1MiB`
  );
  const fileName = `${work.cardId}.webp`;
  const localPath = `/${PUBLIC_DIRECTORY}/${fileName}`;
  return {
    data,
    record: {
      cardId: work.cardId,
      originalUri: work.asset.uri,
      originalHash: work.asset.content_hash,
      sourcePage: work.url,
      localPath,
      asset: {
        id: `meme-${work.cardId}-display`,
        kind: "image",
        uri: `https://6529.io${localPath}`,
        content_hash: hash(data),
        mime_type: "image/webp",
        width: info.width,
        height: info.height,
        file_size_bytes: data.length,
        alt_text: work.asset.alt_text,
        rights: `${work.asset.rights} Display derivative: frame 0, resized without cropping.`,
        roles: ["poster", "grid", "detail"],
      },
    },
  };
}

async function writePreviews(): Promise<void> {
  const previews: Awaited<ReturnType<typeof buildPreview>>[] = [];
  // At most two downloads/decodes at once; stable catalog order makes output reproducible.
  for (let index = 0; index < CMS_STUDIO_MEME_WORKS.length; index += 2) {
    previews.push(
      ...(await Promise.all(
        CMS_STUDIO_MEME_WORKS.slice(index, index + 2).map(buildPreview)
      ))
    );
  }
  await mkdir(path.join(REPO_ROOT, "public", PUBLIC_DIRECTORY), {
    recursive: true,
  });
  for (const preview of previews) {
    await writeFile(
      path.join(REPO_ROOT, "public", preview.record.localPath),
      preview.data
    );
  }
  const manifest = {
    schema: "6529.cms.template-display-assets.v1",
    encoder: {
      sharp: sharp.versions.sharp,
      vips: sharp.versions.vips,
      webp: sharp.versions.webp,
    },
    transform: TRANSFORM,
    assets: previews.map((item) => item.record),
  };
  await writeFile(
    MANIFEST_PATH,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  console.info(
    `Generated ${previews.length} static previews (${previews.reduce((size, item) => size + item.data.length, 0)} bytes total).`
  );
}

async function checkPreviews(): Promise<void> {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as {
    schema: string;
    transform: typeof TRANSFORM;
    assets: Awaited<ReturnType<typeof buildPreview>>["record"][];
  };
  assert.equal(manifest.schema, "6529.cms.template-display-assets.v1");
  assert.deepEqual(manifest.transform, TRANSFORM);
  assert.equal(manifest.assets.length, CMS_STUDIO_MEME_WORKS.length);
  for (const [index, work] of CMS_STUDIO_MEME_WORKS.entries()) {
    const display = manifest.assets[index];
    assert.ok(display);
    assert.equal(display.cardId, work.cardId);
    assert.equal(display.originalUri, work.asset.uri);
    assert.equal(display.originalHash, work.asset.content_hash);
    assert.equal(display.sourcePage, work.url);
    assert.equal(display.localPath, `/${PUBLIC_DIRECTORY}/${work.cardId}.webp`);
    const bytes = await readFile(
      path.join(REPO_ROOT, "public", display.localPath)
    );
    assert.equal(hash(bytes), display.asset.content_hash);
    assert.equal(bytes.length, display.asset.file_size_bytes);
    assert.equal(display.asset.alt_text, work.asset.alt_text);
    assert.equal(
      display.asset.rights,
      `${work.asset.rights} Display derivative: frame 0, resized without cropping.`
    );
    assert.deepEqual(display.asset.roles, ["poster", "grid", "detail"]);
    assert.ok(bytes.length <= MAX_PREVIEW_BYTES);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.pages ?? 1, 1);
    assert.equal(metadata.width, display.asset.width);
    assert.equal(metadata.height, display.asset.height);
    assert.ok(
      display.asset.width <= MAX_EDGE && display.asset.height <= MAX_EDGE
    );
  }
  console.info(
    `Verified ${manifest.assets.length} static previews, source bindings, dimensions, and byte hashes.`
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  assert.ok(
    args.length === 1 && ["--write", "--check"].includes(args[0] ?? ""),
    "Pass exactly --write or --check"
  );
  if (args[0] === "--write") await writePreviews();
  await checkPreviews();
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Template preview generation failed"
  );
  process.exitCode = 1;
});
