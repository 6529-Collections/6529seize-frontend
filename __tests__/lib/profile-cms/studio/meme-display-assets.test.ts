import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { MEME_ART_ASSETS } from "@/lib/profile-cms/studio/meme-assets";
import {
  CMS_STUDIO_MEME_DISPLAY_ASSETS,
  getCmsStudioMemeDisplayAsset,
} from "@/lib/profile-cms/studio/meme-display-assets";

describe("CMS Meme display assets", () => {
  it("binds all 16 original media assets to distinct, verified static WebP files", () => {
    expect(CMS_STUDIO_MEME_DISPLAY_ASSETS).toHaveLength(16);
    expect(MEME_ART_ASSETS).toHaveLength(16);
    expect(
      new Set(CMS_STUDIO_MEME_DISPLAY_ASSETS.map((item) => item.localPath)).size
    ).toBe(16);
    for (const original of MEME_ART_ASSETS) {
      const display = getCmsStudioMemeDisplayAsset(original);
      expect(display).not.toBeNull();
      expect(display!.originalUri).toBe(original.uri);
      expect(display!.originalHash).toBe(original.content_hash);
      expect(display!.asset.uri).toBe(`https://6529.io${display!.localPath}`);
      expect(display!.asset.uri).not.toBe(original.uri);
      expect(display!.asset.content_hash).not.toBe(original.content_hash);
      expect(display!.asset.mime_type).toBe("image/webp");
      expect(display!.asset.rights).toContain(original.rights!);
      const bytes = readFileSync(
        path.join(process.cwd(), "public", display!.localPath)
      );
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
      expect(bytes.length).toBe(display!.asset.file_size_bytes);
      expect(bytes.length).toBeLessThanOrEqual(1024 * 1024);
      expect(`sha256:${createHash("sha256").update(bytes).digest("hex")}`).toBe(
        display!.asset.content_hash
      );
      expect(display!.asset.width).toBeLessThanOrEqual(1440);
      expect(display!.asset.height).toBeLessThanOrEqual(1440);
    }
  });

  it("does not reuse a trusted preview for another URI or signed hash", () => {
    const original = MEME_ART_ASSETS[0]!;
    expect(
      getCmsStudioMemeDisplayAsset({
        ...original,
        uri: "https://example.com/image",
      })
    ).toBeNull();
    expect(
      getCmsStudioMemeDisplayAsset({
        ...original,
        content_hash: `sha256:${"0".repeat(64)}`,
      })
    ).toBeNull();
  });
});
