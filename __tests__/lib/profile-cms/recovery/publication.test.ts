/** @jest-environment node */
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { TypedDataEncoder, Wallet } from "ethers";

import fixture from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
import {
  blockSchema,
  canonicalizeJson,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import {
  CMS_PUBLICATION_SCHEMA,
  CMS_PUBLISH_TYPES,
  recoverCmsPublication,
  type CmsPublication,
} from "@/lib/profile-cms/recovery/publication";
import {
  cmsRecoveryFilePath,
  independentCmsUri,
  renderRecoveredCmsSite,
} from "@/lib/profile-cms/recovery/static-site";

async function publicationFixture(
  transformPackage?: (cmsPackage: CmsPackageV1) => void,
  publicationOverrides: { handle?: string; primaryPath?: string } = {}
) {
  const wallet = Wallet.createRandom();
  const input: CmsPackageV1 = {
    ...(JSON.parse(JSON.stringify(fixture)) as CmsPackageV1),
    profile: { ...fixture.profile, primary_wallet: wallet.address },
  };
  transformPackage?.(input);
  const cmsPackage = withComputedCmsHashes(input);
  const signedHandle = publicationOverrides.handle ?? cmsPackage.profile.handle;
  const uri = `ar://${"a".repeat(43)}`;
  const domain = {
    name: "6529 Profile CMS" as const,
    version: "1" as const,
    chainId: 1,
  };
  const message = {
    action: "publish" as const,
    profileId: fixture.profile.profile_id,
    handle: signedHandle,
    packageId: cmsPackage.package_id,
    version: 1,
    draftId: "draft-recovery-test",
    payloadHash: cmsPackage.integrity.payload_hash,
    packageHash: cmsPackage.integrity.package_hash,
    primaryPath:
      publicationOverrides.primaryPath ?? `/${signedHandle}/index.html`,
    storageProvider: "arweave" as const,
    storageUri: uri,
    storageContentHash: cmsPackage.integrity.package_hash,
    deadline: 1783295985814,
  };
  const signature = await wallet.signTypedData(
    domain,
    CMS_PUBLISH_TYPES,
    message
  );
  cmsPackage.signatures = [
    {
      type: "eip712",
      signer: wallet.address,
      signature,
      signed_at: "2026-07-05T23:59:45.810Z",
      domain: {
        ...domain,
        typed_data_hash: TypedDataEncoder.hash(
          domain,
          CMS_PUBLISH_TYPES,
          message
        ),
      },
    },
  ];
  cmsPackage.storage = [
    {
      provider: "arweave",
      uri,
      canonical: true,
      content_hash: cmsPackage.integrity.package_hash,
      recorded_at: "2026-07-05T23:59:45.810Z",
    },
  ];
  const { signatures, storage, integrity, ...body } = cmsPackage;
  const { package_hash: packageHash, ...coreIntegrity } = integrity;
  const bytes = new TextEncoder().encode(
    canonicalizeJson({ ...body, integrity: coreIntegrity })
  );
  const manifest: CmsPublication = {
    schema: CMS_PUBLICATION_SCHEMA,
    package_uri: uri,
    package_hash: packageHash,
    payload_hash: integrity.payload_hash,
    profile_id: message.profileId,
    profile_handle: message.handle,
    package_id: message.packageId,
    package_db_id: message.draftId,
    version: 1,
    primary_path: message.primaryPath,
    typed_data: {
      domain,
      types: CMS_PUBLISH_TYPES,
      primaryType: "ProfileCmsPublish",
      message,
    },
    signature,
    signature_kind: "eoa",
    signer_address: wallet.address,
    package_envelope: { signatures, storage, integrity },
    published_at: 1783295985810,
  };
  return { cmsPackage, bytes, manifest };
}

describe("independent CMS publication recovery", () => {
  it("reconstructs and renders a signed website without network access, including after the publish deadline", async () => {
    const { cmsPackage, bytes, manifest } = await publicationFixture();
    const recovered = await recoverCmsPublication(manifest, bytes);
    expect(recovered.cmsPackage).toEqual(cmsPackage);
    expect(recovered.verification).toBe("eoa");
    const files = renderRecoveredCmsSite(recovered.cmsPackage);
    const html = files.get(cmsRecoveryFilePath(cmsPackage.site.base_path));
    expect(html).toContain(
      "This is the smallest valid profile CMS homepage fixture."
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("api.6529.io");
  });

  it.each([
    "profile_handle",
    "package_db_id",
    "primary_path",
    "package_uri",
  ] as const)("rejects a substituted %s", async (field) => {
    const { bytes, manifest } = await publicationFixture();
    manifest[field] = "substituted";
    await expect(recoverCmsPublication(manifest, bytes)).rejects.toThrow(
      "mismatch"
    );
  });

  it("rejects changed content bytes", async () => {
    const { bytes, manifest } = await publicationFixture();
    const changed = new TextEncoder().encode(
      new TextDecoder().decode(bytes).replace("smallest", "tampered")
    );
    await expect(recoverCmsPublication(manifest, changed)).rejects.toThrow(
      "stored content hash mismatch"
    );
  });

  it("rejects alternate typed-data definitions even with a valid JSON shape", async () => {
    const { bytes, manifest } = await publicationFixture();
    manifest.typed_data.types = {
      ProfileCmsPublish: [{ name: "action", type: "string" }],
    };
    await expect(recoverCmsPublication(manifest, bytes)).rejects.toThrow(
      "typed-data types mismatch"
    );
  });

  it("rejects a substituted signer or envelope", async () => {
    const { bytes, manifest } = await publicationFixture();
    manifest.signer_address = Wallet.createRandom().address;
    await expect(recoverCmsPublication(manifest, bytes)).rejects.toThrow(
      "signature digest mismatch"
    );
  });

  it("rejects a signature reinterpreted under a different chain", async () => {
    const { bytes, manifest } = await publicationFixture();
    manifest.typed_data.domain.chainId = 10;
    await expect(recoverCmsPublication(manifest, bytes)).rejects.toThrow(
      "signature digest mismatch"
    );
  });

  it("requires explicit contract-wallet verification and propagates a rejected result", async () => {
    const { bytes, manifest } = await publicationFixture();
    manifest.signature_kind = "eip1271";
    await expect(recoverCmsPublication(manifest, bytes)).rejects.toThrow(
      "explicit chain RPC"
    );
    await expect(
      recoverCmsPublication(manifest, bytes, async () => false)
    ).rejects.toThrow("Invalid contract-wallet");
    const verifyContract = jest.fn(async () => true);
    const recovered = await recoverCmsPublication(
      manifest,
      bytes,
      verifyContract
    );
    expect(recovered.verification).toBe("eip1271-current-state");
    expect(verifyContract).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: 1,
        signer: manifest.signer_address,
        signature: manifest.signature,
      })
    );
  });

  it("recovers an imported core whose handle casing differs from the signed live profile", async () => {
    const { cmsPackage, bytes, manifest } = await publicationFixture(
      undefined,
      { handle: "PuNk6529" }
    );
    const recovered = await recoverCmsPublication(manifest, bytes);
    expect(recovered.cmsPackage).toEqual(cmsPackage);
    expect(recovered.cmsPackage.profile.handle).toBe("punk6529");
    expect(recovered.publication.primary_path).toBe("/PuNk6529/index.html");
    expect(
      renderRecoveredCmsSite(recovered.cmsPackage).has(
        cmsRecoveryFilePath("/punk6529/index.html")
      )
    ).toBe(true);
  });

  it("preserves a non-root site base path while verifying the signed canonical profile root", async () => {
    const { cmsPackage, bytes, manifest } = await publicationFixture(
      (input) => {
        input.site.base_path = "/punk6529/start/index.html";
        input.payload.routes.push({
          path: input.site.base_path,
          kind: "alias",
          target: "/punk6529/index.html",
        });
      }
    );
    const recovered = await recoverCmsPublication(manifest, bytes);
    expect(recovered.cmsPackage).toEqual(cmsPackage);
    expect(recovered.cmsPackage.site.base_path).toBe(
      "/punk6529/start/index.html"
    );
    expect(recovered.publication.primary_path).toBe("/punk6529/index.html");
    expect(renderRecoveredCmsSite(recovered.cmsPackage).size).toBe(2);
  });

  it("rejects a valid signature for a different profile handle", async () => {
    const { bytes, manifest } = await publicationFixture(undefined, {
      handle: "anotherprofile",
    });
    await expect(recoverCmsPublication(manifest, bytes)).rejects.toThrow(
      "content handle mismatch"
    );
  });

  it("rejects a valid signature for a noncanonical primary route", async () => {
    const { bytes, manifest } = await publicationFixture(undefined, {
      primaryPath: "/punk6529/other/index.html",
    });
    await expect(recoverCmsPublication(manifest, bytes)).rejects.toThrow(
      "canonical primary path mismatch"
    );
  });
});

describe("portable static rendering", () => {
  it("escapes author text and never activates author HTML or scripts", () => {
    const cmsPackage = JSON.parse(JSON.stringify(fixture)) as CmsPackageV1;
    cmsPackage.payload.pages[0]!.blocks = [
      {
        id: "block-unsafe",
        block_type: "rich_text",
        content: '<script>alert(1)</script><img src=x onerror="alert(2)">',
      },
    ].map((block) => blockSchema.parse(block));
    const html = [...renderRecoveredCmsSite(cmsPackage).values()][0]!;
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("default-src 'none'");
  });

  it("renders aliases and links to local pages", () => {
    const cmsPackage = JSON.parse(JSON.stringify(fixture)) as CmsPackageV1;
    cmsPackage.payload.routes.push({
      path: "/punk6529/alias/index.html",
      kind: "alias",
      target: "/punk6529/index.html",
    });
    const files = renderRecoveredCmsSite(cmsPackage);
    expect(files.size).toBe(2);
    expect(files.get("cms-punk6529/cms-alias/index.html")).toContain(
      'href="../index.html"'
    );
  });

  it("rejects traversal and uses portable directory names", () => {
    expect(() => cmsRecoveryFilePath("/profile/../index.html")).toThrow(
      "Unsafe"
    );
    expect(cmsRecoveryFilePath("/profile/CON/index.html")).toBe(
      "cms-profile/cms-%43%4f%4e/index.html"
    );
    expect(cmsRecoveryFilePath("/profile/test./index.html")).toBe(
      "cms-profile/cms-test%2e/index.html"
    );
  });

  it("writes valid case-distinct and nested index.html routes without filesystem collisions", async () => {
    const cmsPackage = JSON.parse(JSON.stringify(fixture)) as CmsPackageV1;
    const paths = [
      "/punk6529/Art/index.html",
      "/punk6529/art/index.html",
      "/punk6529/index.html/child/index.html",
      "/punk6529/CON/index.html",
      "/punk6529/test./index.html",
      "/punk6529/test/index.html",
      `/punk6529/${"a".repeat(400)}/index.html`,
      `/punk6529/${"deep/".repeat(40)}index.html`,
    ];
    for (const path of paths) {
      cmsPackage.payload.routes.push({
        path,
        kind: "alias",
        target: fixture.site.base_path,
      });
    }
    cmsPackage.payload.pages[0]!.blocks = paths.map((path, index) => ({
      id: `block-link-${index}`,
      block_type: "button_link",
      label: path,
      href: path,
    }));
    expect(
      validateCmsPackageV1(cmsPackage, {
        allowFixtureSignatures: true,
        allowFixtureStorage: true,
        enforceHashes: false,
      }).valid
    ).toBe(true);
    const files = renderRecoveredCmsSite(cmsPackage);
    expect(files.size).toBe(paths.length + 1);
    expect(
      new Set([...files.keys()].map((path) => path.toLowerCase())).size
    ).toBe(files.size);
    const directory = await mkdtemp(join(tmpdir(), "cms-recovery-test-"));
    try {
      for (const [path, html] of files) {
        const target = join(directory, path);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, html, { flag: "wx" });
      }
      const home = resolve(
        directory,
        cmsRecoveryFilePath(cmsPackage.site.base_path)
      );
      const html = await readFile(home, "utf8");
      const links = [...html.matchAll(/href="([^"]+)"/g)];
      expect(links).toHaveLength(paths.length + 1);
      for (const link of links) {
        const target = fileURLToPath(new URL(link[1]!, pathToFileURL(home)));
        expect(await readFile(target, "utf8")).toContain("<!doctype html>");
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("preserves authored navigation, local aliases, query strings and block anchors", () => {
    const cmsPackage = JSON.parse(JSON.stringify(fixture)) as CmsPackageV1;
    cmsPackage.payload.routes.push({
      path: "/punk6529/Art/index.html",
      kind: "alias",
      target: cmsPackage.site.base_path,
    });
    cmsPackage.payload.navigation[0]!.items = [
      {
        label: "Selected works",
        children: [
          {
            label: "View the quote",
            url: "/punk6529/Art/index.html?mode=print&v=1#block-quote",
          },
        ],
      },
      { label: "External archive", url: "https://example.org/archive" },
    ];
    cmsPackage.payload.pages[0]!.blocks = [
      {
        id: "block-quote",
        block_type: "quote",
        quote: "<Keep the original words>",
        citation: "The author & collector",
      },
      {
        id: "block-callout",
        block_type: "callout",
        tone: "Warning",
        title: "Archival context",
        content: "Keep this context too.",
      },
    ].map((block) => blockSchema.parse(block));
    const html = renderRecoveredCmsSite(cmsPackage).get(
      cmsRecoveryFilePath(cmsPackage.site.base_path)
    )!;
    expect(html).toContain(
      'href="cms-%2541rt/index.html?mode=print&amp;v=1#block-quote"'
    );
    expect(html).toContain('href="https://example.org/archive"');
    expect(html).toContain("Selected works");
    expect(html).not.toContain(">Home</a>");
    expect(html).toContain('id="block-quote"');
    expect(html).toContain("&lt;Keep the original words&gt;");
    expect(html).toContain("<cite>The author &amp; collector</cite>");
    expect(html).toContain("<h2>Archival context</h2>");
    expect(html).toContain("<p>Warning</p>");
    expect(html).toContain("Keep this context too.");
  });

  it("exports external redirects and aliases to them as inert pages with destination links", () => {
    const cmsPackage = JSON.parse(JSON.stringify(fixture)) as CmsPackageV1;
    cmsPackage.payload.routes.push(
      {
        path: "/punk6529/external/index.html",
        kind: "redirect",
        target: "https://example.org/exhibit?one=1&two=2",
      },
      {
        path: "/punk6529/alias/index.html",
        kind: "alias",
        target: "/punk6529/external/index.html",
      }
    );
    const files = renderRecoveredCmsSite(cmsPackage);
    expect(files.size).toBe(3);
    for (const path of ["external", "alias"]) {
      const html = files.get(
        cmsRecoveryFilePath(`/punk6529/${path}/index.html`)
      )!;
      expect(html).toContain(
        'href="https://example.org/exhibit?one=1&amp;two=2"'
      );
      expect(html).not.toContain('http-equiv="refresh"');
    }
  });

  it("fails explicitly for redirect cycles instead of silently losing routes", () => {
    const cmsPackage = JSON.parse(JSON.stringify(fixture)) as CmsPackageV1;
    cmsPackage.payload.routes.push({
      path: "/punk6529/loop/index.html",
      kind: "alias",
      target: "/punk6529/loop/index.html",
    });
    expect(() => renderRecoveredCmsSite(cmsPackage)).toThrow(
      "unresolved or cyclic route"
    );
  });

  it("retains gallery copy, media posters and captions, and interactive fallback references", () => {
    const cmsPackage = JSON.parse(JSON.stringify(fixture)) as CmsPackageV1;
    cmsPackage.payload.assets.push(
      {
        id: "asset-video",
        kind: "video",
        uri: "https://example.org/video.mp4",
        content_hash: `sha256:${"a".repeat(64)}`,
        mime_type: "video/mp4",
        alt_text: "Artist video caption",
      },
      {
        id: "asset-object",
        kind: "model",
        uri: "https://example.org/art.glb",
        content_hash: `sha256:${"a".repeat(64)}`,
        mime_type: "model/gltf-binary",
      }
    );
    cmsPackage.payload.pages[0]!.blocks = [
      {
        id: "block-gallery",
        block_type: "gallery",
        title: "Curated works",
        description: "The artist's original selection.",
        asset_ids: ["asset-og"],
      },
      {
        id: "block-video",
        block_type: "video",
        poster_asset_id: "asset-og",
        asset_id: "asset-video",
      },
      {
        id: "block-object",
        block_type: "object_viewer",
        title: "Sculpture",
        poster_asset_id: "asset-og",
        asset_id: "asset-object",
      },
    ].map((block) => blockSchema.parse(block));
    const html = [...renderRecoveredCmsSite(cmsPackage).values()][0]!;
    expect(html).toContain("<h2>Curated works</h2>");
    expect(html).toContain("The artist&#39;s original selection.");
    expect(html).toContain("<figcaption>Artist video caption</figcaption>");
    expect(html).toContain(
      "<figcaption>Social preview image for punk6529</figcaption>"
    );
    expect(html).toContain('src="https://example.org/video.mp4"');
    expect(html).toContain('href="https://example.org/art.glb"');
    expect(html).toContain("<h2>Sculpture</h2>");
    expect(html).not.toContain("<iframe");
  });

  it("resolves decentralized assets independently and rejects executable URLs", () => {
    expect(independentCmsUri(`ar://${"a".repeat(43)}`)).toBe(
      `https://arweave.net/${"a".repeat(43)}`
    );
    expect(independentCmsUri("ipfs://bafyexample/image.png")).toBe(
      "https://ipfs.io/ipfs/bafyexample/image.png"
    );
    expect(independentCmsUri("javascript:alert(1)")).toBeNull();
    expect(independentCmsUri("//evil.example/script")).toBeNull();
    expect(independentCmsUri("https://user:pass@example.com/")).toBeNull();
  });

  it("preserves encoded decentralized asset paths without double encoding or traversal", () => {
    expect(
      independentCmsUri(
        "IPFS://bafyexample/Artist%20Name/image.png?download=1#preview"
      )
    ).toBe(
      "https://ipfs.io/ipfs/bafyexample/Artist%20Name/image.png?download=1#preview"
    );
    expect(
      independentCmsUri(`ARWEAVE://${"a".repeat(43)}/image%20one.png`)
    ).toBe(`https://arweave.net/${"a".repeat(43)}/image%20one.png`);
    for (const path of [
      "../outside",
      "%2e%2e/outside",
      "%2foutside",
      "%5coutside",
      "%00",
      "%invalid",
    ]) {
      expect(independentCmsUri(`ipfs://bafyexample/${path}`)).toBeNull();
    }
  });

  it("retains referenced NFT provenance, room fallbacks, deep zoom assets and gallery snapshot data", () => {
    const cmsPackage = JSON.parse(JSON.stringify(fixture)) as CmsPackageV1;
    cmsPackage.payload.nft_media_profiles = [
      {
        id: "nft-profile-test",
        chain_id: 1,
        contract: "0x1111111111111111111111111111111111111111",
        token_id: "6529",
        display_variants: [{ role: "detail", asset_id: "asset-og" }],
        snapshot: { owner: "0x2222222222222222222222222222222222222222" },
      },
    ];
    cmsPackage.payload.deep_zoom_manifests = [
      {
        id: "zoom-test",
        source_asset_id: "asset-og",
        tile_size: 256,
        levels: 2,
        format: "png",
      },
    ];
    cmsPackage.payload.exhibition_rooms = [
      {
        id: "room-test",
        title: "The exhibition room",
        room_type: "wall",
        fallback_page_id: "page-home",
        poster_asset_id: "asset-og",
        placements: [
          {
            id: "placement-test",
            asset_id: "asset-og",
            detail_page_id: "page-home",
            display_mode: "faithful",
            label: "Artwork label",
          },
        ],
      },
    ];
    cmsPackage.payload.pages[0]!.blocks = [
      {
        id: "block-nft",
        block_type: "nft_reference",
        nft_media_profile_id: "nft-profile-test",
      },
      {
        id: "block-zoom",
        block_type: "deep_zoom",
        deep_zoom_manifest_id: "zoom-test",
      },
      { id: "block-room", block_type: "room_viewer", room_id: "room-test" },
      {
        id: "block-generated",
        block_type: "generated_wallet_gallery",
        featured_page_ids: ["page-home"],
        snapshot: {
          captured_at: "2026-09-10T00:00:00.000Z",
          block_number: 25000000,
        },
        wallets: ["0x3333333333333333333333333333333333333333"],
      },
    ].map((block) => blockSchema.parse(block));
    const html = [...renderRecoveredCmsSite(cmsPackage).values()][0]!;
    expect(html).toContain("0x1111111111111111111111111111111111111111");
    expect(html).toContain("0x2222222222222222222222222222222222222222");
    expect(html).toContain("2026-09-10T00:00:00.000Z");
    expect(html).toContain("25000000");
    expect(html).toContain("0x3333333333333333333333333333333333333333");
    expect(html).toContain("<h2>The exhibition room</h2>");
    expect(html).toContain(">Artwork label</a>");
    expect(html.match(/<img /g)).toHaveLength(4);
  });
});
