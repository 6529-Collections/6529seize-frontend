import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildDelegationArticleUrls,
  type DelegationContentArticle,
  delegationContentManifest,
  fetchDelegationArticleHtml,
  getDelegationArticle,
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

describe("delegationContent", () => {
  it("uses the reviewed local bundle while the IPFS CID is pending", () => {
    const article = getDelegationArticle("delegation-faq");

    expect(article).toBeDefined();
    expect(buildDelegationArticleUrls(article!)).toEqual([
      "/delegation-content/delegation-docs-2026-06-16/html/delegation-faq.html",
    ]);
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
      url: "/delegation-content/delegation-docs-2026-06-16/html/delegation-faq.html",
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
      url: "/delegation-content/delegation-docs-2026-06-16/html/using-safe.html",
      html: expect.stringContaining(
        'src="/delegation-content/delegation-docs-2026-06-16/assets/screenshots/safe1.png"'
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
});
