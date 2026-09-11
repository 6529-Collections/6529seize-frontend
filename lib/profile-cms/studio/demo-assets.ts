import type { CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";

/** Original demonstration works, never represented as the profile's NFTs. */
export const DEMO_ART_ASSETS: readonly CmsAssetV1[] = [
  {
    id: "demo-quiet-signal",
    kind: "image",
    uri: "https://6529.io/profile-cms/templates/quiet-signal.png",
    content_hash:
      "sha256:a8f0e51f3a34136ba6633330116ca39e55ee09b4df8c67db5c17a1e8a65f02c6",
    mime_type: "image/png",
    width: 1536,
    height: 1024,
    file_size_bytes: 3244174,
    alt_text:
      "Cobalt threads fold into a translucent ribbon above an ivory ground, with a small vermilion accent.",
    rights: "Original example artwork generated for the 6529 template library.",
    roles: ["original", "grid", "detail", "fullscreen"],
  },
  {
    id: "demo-afterimage",
    kind: "image",
    uri: "https://6529.io/profile-cms/templates/afterimage.png",
    content_hash:
      "sha256:a6ba323b786759b2a33ff2b2f76cbfe52151f2ff7fc2dcee5367793efb57b5d4",
    mime_type: "image/png",
    width: 1122,
    height: 1402,
    file_size_bytes: 1800749,
    alt_text:
      "A looping polished metal sheet floats above a burnt-orange ground, reflecting warm light.",
    rights: "Original example artwork generated for the 6529 template library.",
    roles: ["original", "grid", "detail", "fullscreen"],
  },
  {
    id: "demo-night-grid",
    kind: "image",
    uri: "https://6529.io/profile-cms/templates/night-grid.png",
    content_hash:
      "sha256:2e98427074714484fc413110198a796ddd9f9e7fa2c5e598000eb5b341bb3ac6",
    mime_type: "image/png",
    width: 1254,
    height: 1254,
    file_size_bytes: 2584338,
    alt_text:
      "Tiny gold and teal marks form an imaginary city grid crossed by one diagonal band of light.",
    rights: "Original example artwork generated for the 6529 template library.",
    roles: ["original", "grid", "detail", "fullscreen"],
  },
];

export function getCmsStudioDemoAssetPath(asset: CmsAssetV1): string | null {
  const demo = DEMO_ART_ASSETS.find(
    (candidate) =>
      candidate.uri === asset.uri &&
      candidate.content_hash === asset.content_hash
  );
  return demo ? new URL(demo.uri).pathname : null;
}

export function getCmsStudioDemoAssetTitle(asset: CmsAssetV1): string | null {
  if (!getCmsStudioDemoAssetPath(asset)) return null;
  const titles: Readonly<Record<string, string>> = {
    "demo-quiet-signal": "Quiet Signal",
    "demo-afterimage": "Afterimage",
    "demo-night-grid": "Night Grid",
  };
  const original = DEMO_ART_ASSETS.find((item) => item.uri === asset.uri);
  return original ? (titles[original.id] ?? null) : null;
}
