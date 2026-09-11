import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildDelegationArticleUrls,
  type DelegationContentArticle,
  delegationContentManifest,
  fetchDelegationArticleHtml,
  getDelegationArticle,
  loadDelegationArticleHtml,
  MAX_DELEGATION_ARTICLE_BYTES,
  resolveDelegationArticleAssetUrls,
} from "@/components/delegation/html/delegationContent";

function getReviewedArticlePath(article: DelegationContentArticle) {
  return path.join(
    process.cwd(),
    "public",
    delegationContentManifest.localBasePath.replace(/^\/+/, ""),
    article.path
  );
}

function createOversizedReadableBody() {
  let sent = false;

  return {
    getReader: () => ({
      cancel: jest.fn(() => Promise.resolve()),
      read: jest.fn(() => {
        if (sent) {
          return Promise.resolve({ done: true, value: undefined });
        }

        sent = true;
        return Promise.resolve({
          done: false,
          value: new Uint8Array(MAX_DELEGATION_ARTICLE_BYTES + 1),
        });
      }),
    }),
  } as unknown as ReadableStream<Uint8Array>;
}

function createReadableBody(chunks: Uint8Array[]) {
  let index = 0;

  return {
    getReader: () => ({
      cancel: jest.fn(() => Promise.resolve()),
      read: jest.fn(() => {
        if (index >= chunks.length) {
          return Promise.resolve({ done: true, value: undefined });
        }

        return Promise.resolve({ done: false, value: chunks[index++] });
      }),
    }),
  } as unknown as ReadableStream<Uint8Array>;
}

function splitInsideFirstMultibyteCharacter(bytes: Uint8Array) {
  const splitIndex = bytes.findIndex((byte) => byte >= 0xc0);

  if (splitIndex < 0) {
    throw new Error("Expected article fixture to contain multibyte text");
  }

  return [bytes.slice(0, splitIndex + 1), bytes.slice(splitIndex + 1)];
}

describe("delegationContent", () => {
  const publishedRootCid = delegationContentManifest.canonicalStorage.rootCid;
  if (!publishedRootCid) {
    throw new Error("Expected delegation content manifest to define rootCid");
  }
  const publishedCloudFrontBaseUrl =
    delegationContentManifest.acceleration.cloudFrontBaseUrl;
  if (!publishedCloudFrontBaseUrl) {
    throw new Error("Expected delegation content manifest to define CDN URL");
  }
  const publishedGatewayBaseUrl = `https://ipfs.6529.io/ipfs/${publishedRootCid}`;

  it("keeps the reviewed source manifest and public mirror in sync", async () => {
    const publicManifestPath = path.join(
      process.cwd(),
      "public",
      delegationContentManifest.localBasePath.replace(/^\/+/, ""),
      "manifest.json"
    );
    const [sourceManifest, publicManifest] = await Promise.all([
      readFile(
        path.join(process.cwd(), "content", "delegation", "manifest.json"),
        "utf8"
      ),
      readFile(publicManifestPath, "utf8"),
    ]);

    expect(JSON.parse(publicManifest)).toEqual(JSON.parse(sourceManifest));
  });

  it("publishes article images with alt text", async () => {
    const missingAlt: string[] = [];

    for (const [slug, article] of Object.entries(
      delegationContentManifest.articles
    )) {
      const html = await readFile(getReviewedArticlePath(article), "utf8");
      const template = document.createElement("template");
      template.innerHTML = html;

      for (const image of Array.from(
        template.content.querySelectorAll("img")
      )) {
        if (!image.hasAttribute("alt")) {
          missingAlt.push(`${slug}: ${image.getAttribute("src") ?? ""}`);
        }
      }
    }

    expect(missingAlt).toEqual([]);
  });

  it("uses CloudFront, CID-addressed IPFS gateways, then the local bundle", () => {
    const article = getDelegationArticle("delegation-faq");

    expect(article).toBeDefined();
    expect(buildDelegationArticleUrls(article!)).toEqual([
      `${publishedCloudFrontBaseUrl}/html/delegation-faq.html`,
      `${publishedGatewayBaseUrl}/html/delegation-faq.html`,
      `https://ipfs.io/ipfs/${publishedRootCid}/html/delegation-faq.html`,
      "/delegation-content/delegation-docs-2026-06-16/html/delegation-faq.html",
    ]);
  });

  it("records each article source URI under the canonical CID", () => {
    for (const article of Object.values(delegationContentManifest.articles)) {
      expect(article.sourceUri).toBe(
        `ipfs://${publishedRootCid}/${article.path}`
      );
    }
  });

  it("prefers the CDN and IPFS gateways when a root CID is configured", () => {
    const article = getDelegationArticle("delegation-faq");

    expect(article).toBeDefined();
    expect(
      buildDelegationArticleUrls(article!, {
        ...delegationContentManifest,
        canonicalStorage: {
          type: "ipfs",
          rootCid: "bafydelegationdocs",
        },
        acceleration: {
          primaryGatewayBaseUrl: "https://ipfs.6529.io/ipfs",
          fallbackGatewayBaseUrls: ["https://ipfs.io/ipfs"],
          cloudFrontBaseUrl:
            "https://cdn.6529.io/delegation-content/bafydelegationdocs",
        },
      })
    ).toEqual([
      "https://cdn.6529.io/delegation-content/bafydelegationdocs/html/delegation-faq.html",
      "https://ipfs.6529.io/ipfs/bafydelegationdocs/html/delegation-faq.html",
      "https://ipfs.io/ipfs/bafydelegationdocs/html/delegation-faq.html",
      "/delegation-content/delegation-docs-2026-06-16/html/delegation-faq.html",
    ]);
  });

  it("does not emit CDN or gateway URLs without a root CID", () => {
    const article = getDelegationArticle("delegation-faq");

    expect(article).toBeDefined();
    expect(
      buildDelegationArticleUrls(article!, {
        ...delegationContentManifest,
        canonicalStorage: {
          type: "ipfs",
          rootCid: null,
        },
        acceleration: {
          ...delegationContentManifest.acceleration,
          cloudFrontBaseUrl:
            "https://cdn.6529.io/delegation-content/bafydelegationdocs",
        },
      })
    ).toEqual([
      "/delegation-content/delegation-docs-2026-06-16/html/delegation-faq.html",
    ]);
  });

  it("loads article html only when the manifest hash matches", async () => {
    const article = getDelegationArticle("delegation-faq");
    const html = await readFile(getReviewedArticlePath(article!), "utf8");
    const fetchArticle = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(html),
    });

    await expect(
      fetchDelegationArticleHtml("delegation-faq", fetchArticle)
    ).resolves.toMatchObject({
      article,
      html,
      url: `${publishedCloudFrontBaseUrl}/html/delegation-faq.html`,
    });
  });

  it("resolves packaged asset URLs from the verified article URL", async () => {
    const article = getDelegationArticle("using-safe");
    const html = await readFile(getReviewedArticlePath(article!), "utf8");
    const fetchArticle = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(html),
    });

    await expect(
      fetchDelegationArticleHtml("using-safe", fetchArticle)
    ).resolves.toMatchObject({
      url: `${publishedCloudFrontBaseUrl}/html/using-safe.html`,
      html: expect.stringContaining(
        `src="${publishedCloudFrontBaseUrl}/assets/screenshots/safe1.png"`
      ),
    });
  });

  it("resolves all relative article references from the verified article URL", () => {
    const html = resolveDelegationArticleAssetUrls(
      [
        '<img src="../assets/screenshots/safe1.png">',
        '<img src="./assets/local.png">',
        '<a href="./next.html">Next</a>',
        '<a href="#toc">TOC</a>',
        '<a href="/delegation/delegation-faq">FAQ</a>',
      ].join(""),
      "/delegation-content/delegation-docs-2026-06-16/html/using-safe.html"
    );

    expect(html).toContain(
      'src="/delegation-content/delegation-docs-2026-06-16/assets/screenshots/safe1.png"'
    );
    expect(html).toContain(
      'src="/delegation-content/delegation-docs-2026-06-16/html/assets/local.png"'
    );
    expect(html).toContain(
      'href="/delegation-content/delegation-docs-2026-06-16/html/next.html"'
    );
    expect(html).toContain('href="#toc"');
    expect(html).toContain('href="/delegation/delegation-faq"');
  });

  it("loads hash-verified article html from a multi-chunk stream", async () => {
    const article = getDelegationArticle("register-delegation");
    const html = await readFile(getReviewedArticlePath(article!), "utf8");
    const text = jest.fn();
    const bytes = new TextEncoder().encode(html);
    const fetchArticle = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: createReadableBody(splitInsideFirstMultibyteCharacter(bytes)),
      text,
    });

    await expect(
      fetchDelegationArticleHtml("register-delegation", fetchArticle)
    ).resolves.toMatchObject({
      article,
      url: `${publishedCloudFrontBaseUrl}/html/register-delegation.html`,
    });
    expect(text).not.toHaveBeenCalled();
  });

  it("rejects oversized article responses before calling text when content-length is available", async () => {
    const text = jest.fn();
    const fetchArticle = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-length": String(MAX_DELEGATION_ARTICLE_BYTES + 1),
      }),
      text,
    });

    await expect(
      fetchDelegationArticleHtml("delegation-faq", fetchArticle)
    ).rejects.toThrow("byte article limit");
    expect(text).not.toHaveBeenCalled();
  });

  it("rejects oversized streamed article responses without calling text", async () => {
    const text = jest.fn();
    const fetchArticle = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: createOversizedReadableBody(),
      text,
    });

    await expect(
      fetchDelegationArticleHtml("delegation-faq", fetchArticle)
    ).rejects.toThrow("byte article limit");
    expect(text).not.toHaveBeenCalled();
  });

  it("rejects article html when the manifest hash does not match", async () => {
    const fetchArticle = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("<p>tampered</p>"),
    });

    await expect(
      fetchDelegationArticleHtml("delegation-faq", fetchArticle)
    ).rejects.toThrow("Unable to load delegation article delegation-faq");
  });

  it("deduplicates and caches verified article loads", async () => {
    const article = getDelegationArticle("view-delegations");
    const html = await readFile(getReviewedArticlePath(article!), "utf8");
    const fetchArticle = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(html),
    });

    const [first, second] = await Promise.all([
      loadDelegationArticleHtml("view-delegations", fetchArticle),
      loadDelegationArticleHtml("view-delegations", fetchArticle),
    ]);
    const third = await loadDelegationArticleHtml(
      "view-delegations",
      fetchArticle
    );

    expect(fetchArticle).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });
});
