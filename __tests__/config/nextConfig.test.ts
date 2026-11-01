import { configSchema } from "next/dist/server/config-schema";
import { hasRemoteMatch } from "next/dist/shared/lib/match-remote-pattern";
import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";

const publicEnv = {
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
} as PublicEnv;

describe("shared Next config", () => {
  it("permanently redirects the former Delegation Center to Safe Collecting", async () => {
    expect(await sharedConfig(publicEnv, "").redirects?.()).toContainEqual({
      source: "/delegation/delegation-center",
      destination: "/safe-collecting",
      permanent: true,
    });
  });

  it("keeps React Strict Mode disabled by explicit migration policy", () => {
    expect(sharedConfig(publicEnv, "").reactStrictMode).toBe(false);
  });

  it("keeps the build type check on the TypeScript API checker that skips test files", () => {
    expect(sharedConfig(publicEnv, "").experimental?.useTypeScriptCli).toBe(
      false
    );
  });

  it("does not publish production browser source maps by default", () => {
    expect(
      sharedConfig(publicEnv, "").productionBrowserSourceMaps
    ).toBeUndefined();
  });

  it("sends every former Stream review link to /stream", async () => {
    expect(await sharedConfig(publicEnv, "").redirects?.()).toContainEqual({
      source: "/reviews/6529-stream/:path*",
      destination: "/stream",
      permanent: true,
    });
  });

  it("sets no trace exclusions", () => {
    expect(
      sharedConfig(publicEnv, "").outputFileTracingExcludes
    ).toBeUndefined();
  });

  it("includes Sharp libvips assets in the OG image route trace", () => {
    expect(sharedConfig(publicEnv, "").outputFileTracingIncludes).toEqual({
      "/*": [".museum-publication/current.json"],
      "/api/og-metadata/image": [
        "node_modules/@img/sharp-libvips-*/**/*",
        "node_modules/.pnpm/@img+sharp-libvips-*/node_modules/@img/sharp-libvips-*/**/*",
      ],
    });
  });

  it("allows WebAssembly compilation only in encrypted-messages builds", async () => {
    const scriptSrcFor = async (env: PublicEnv): Promise<string> => {
      const headers = await sharedConfig(env, "").headers?.();
      const csp = headers
        ?.flatMap((entry) => entry.headers)
        .find((header) => header.key === "Content-Security-Policy")?.value;
      return (
        csp
          ?.split(";")
          .map((directive) => directive.trim())
          .find((directive) => directive.startsWith("script-src ")) ?? ""
      );
    };

    expect(await scriptSrcFor(publicEnv)).not.toContain("'wasm-unsafe-eval'");
    expect(
      await scriptSrcFor({ ...publicEnv, NEXT_PUBLIC_E2EE_DM_ENABLED: "false" })
    ).not.toContain("'wasm-unsafe-eval'");
    expect(
      await scriptSrcFor({ ...publicEnv, NEXT_PUBLIC_E2EE_DM_ENABLED: "true" })
    ).toContain("'wasm-unsafe-eval'");
  });

  describe("security headers", () => {
    const sentryDsn =
      "https://0123456789abcdef0123456789abcdef@o123.ingest.us.sentry.io/456";

    async function getContentSecurityPolicies(
      env: PublicEnv
    ): Promise<{ site: string; viewer: string }> {
      const rules = (await sharedConfig(env, "").headers?.()) ?? [];
      const policyFor = (source: string) =>
        rules
          .find((rule) => rule.source === source)
          ?.headers.find((header) => header.key === "Content-Security-Policy")
          ?.value ?? "";
      return {
        site: policyFor("/:path*"),
        viewer: policyFor("/artwork/the-memes/445.html"),
      };
    }

    it("reports site CSP violations to Sentry for deployed builds only", async () => {
      const deployed = await getContentSecurityPolicies({
        ...publicEnv,
        NODE_ENV: "production",
        SENTRY_DSN: sentryDsn,
      });
      expect(deployed.site).toContain(
        "report-uri https://o123.ingest.us.sentry.io/api/456/security/?sentry_key=0123456789abcdef0123456789abcdef;"
      );
      expect(deployed.site).toContain("report-to csp-endpoint;");

      for (const NODE_ENV of ["development", "local"] as const) {
        const local = await getContentSecurityPolicies({
          ...publicEnv,
          NODE_ENV,
          SENTRY_DSN: sentryDsn,
        });
        expect(local.site).not.toContain("report-uri");
      }
    });

    it("keeps the isolated artwork viewer on its own same-origin framing policy", async () => {
      const { viewer } = await getContentSecurityPolicies({
        ...publicEnv,
        NODE_ENV: "production",
        SENTRY_DSN: sentryDsn,
      });

      expect(viewer).toContain("frame-ancestors 'self'");
      expect(viewer).not.toContain("report-uri");
    });
  });

  describe("htmlLimitedBots", () => {
    const CHROME_USER_AGENT =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

    // Bots from Next's default list, plus the three this repo adds on top.
    const BOT_USER_AGENTS: Record<string, string> = {
      Bingbot:
        "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      DuckDuckBot: "DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)",
      Applebot:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko; compatible; Applebot/0.1; +http://www.apple.com/go/applebot)",
      YandexBot:
        "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
      Baiduspider:
        "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
      "Google-InspectionTool":
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)",
      Twitterbot: "Twitterbot/1.0",
      Slackbot: "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
      TelegramBot: "TelegramBot/1.0",
      Pinterestbot: "Pinterestbot/1.0 (+http://www.pinterest.com/bot.html)",
      opentweet: "opentweet/1.0",
    };

    const htmlLimitedBots = (): RegExp => {
      const bots = sharedConfig(publicEnv, "").htmlLimitedBots;
      if (!(bots instanceof RegExp)) {
        throw new Error("htmlLimitedBots must be a RegExp");
      }
      return bots;
    };

    it.each(Object.entries(BOT_USER_AGENTS))(
      "matches the %s user agent for blocking metadata",
      (_name, userAgent) => {
        expect(htmlLimitedBots().test(userAgent)).toBe(true);
      }
    );

    it("does not match a normal Chrome user agent", () => {
      expect(htmlLimitedBots().test(CHROME_USER_AGENT)).toBe(false);
    });
  });
});

describe("Alchemy image optimization policy", () => {
  const thumbnailPath =
    "/cdn-cgi/image/width=250,height=250,fit=scale-down/eth-mainnet/a3062b74e1b4d79fdab0ca1ec5a92615";
  const patterns = sharedConfig(publicEnv, "").images?.remotePatterns ?? [];

  it.each([
    `https://nft2-cdn.alchemy.com${thumbnailPath}`,
    "https://res.cloudinary.com/alchemyapi/image/upload/thumbnailv2/eth-mainnet/example",
  ])("allows the supported thumbnail source %s", (url) => {
    expect(hasRemoteMatch([], patterns, new URL(url))).toBe(true);
  });

  it.each([
    `http://nft2-cdn.alchemy.com${thumbnailPath}`,
    `https://nft2-cdn.alchemy.com:8443${thumbnailPath}`,
    `https://nft2-cdn.alchemy.com.evil.example${thumbnailPath}`,
    `https://other.alchemy.com${thumbnailPath}`,
    `https://nft2-cdn.alchemy.com${thumbnailPath}?url=https://example.com`,
    "https://nft2-cdn.alchemy.com/unrelated/image.png",
    "https://nft2-cdn.alchemy.com/cdn-cgi/image/width=250/https://example.com/image.png",
  ])("rejects sources outside the Alchemy thumbnail rule: %s", (url) => {
    expect(hasRemoteMatch([], patterns, new URL(url))).toBe(false);
  });
});

describe("image optimizer hardening", () => {
  const imageConfig = (env: PublicEnv = publicEnv) =>
    sharedConfig(env, "").images ?? {};
  const patternsFor = (env: PublicEnv = publicEnv) =>
    imageConfig(env).remotePatterns ?? [];
  const isOptimizable = (url: string, env: PublicEnv = publicEnv) =>
    hasRemoteMatch([], patternsFor(env), new URL(url));

  describe("local development host", () => {
    const localImage = "http://localhost:3000/uploads/avatar.png";

    it.each(["production", "test", undefined] as const)(
      "does not allow http://localhost images when NODE_ENV is %s",
      (nodeEnv) => {
        const env = { ...publicEnv, NODE_ENV: nodeEnv } as PublicEnv;

        expect(isOptimizable(localImage, env)).toBe(false);
        expect(
          patternsFor(env).some(
            (pattern) =>
              "hostname" in pattern && pattern.hostname === "localhost"
          )
        ).toBe(false);
      }
    );

    it.each(["development", "local"] as const)(
      "allows http://localhost images when NODE_ENV is %s",
      (nodeEnv) => {
        const env = { ...publicEnv, NODE_ENV: nodeEnv };

        expect(isOptimizable(localImage, env)).toBe(true);
        expect(isOptimizable("https://localhost/avatar.png", env)).toBe(false);
      }
    );
  });

  it("pins the upstream response ceiling at Next's 50 MB default for large artwork uploads", () => {
    expect(imageConfig().maximumResponseBody).toBe(50_000_000);
  });

  it("keeps the qualities the app requests available", () => {
    // 100: high-quality artwork preview (DropImagePreview); 75: default.
    expect(imageConfig().qualities).toEqual([100, 75]);
  });

  it("is accepted by Next's config schema, including its 50 remotePatterns limit", () => {
    expect(configSchema.safeParse({ images: imageConfig() }).success).toBe(
      true
    );
  });

  it("has no duplicate remote patterns", () => {
    const patterns = patternsFor();
    const keys = patterns.map((pattern) =>
      pattern instanceof URL
        ? pattern.href
        : `${pattern.protocol}://${pattern.hostname}${pattern.pathname ?? ""}`
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each([
    "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_1/artwork.png",
    "https://i2c.seadn.io/ethereum/0xabc/token.png",
    "https://media.6529.io/arweave/Jv9qMwx8lfuPMch9S_aBFk9-ENL1lWtbEV4zqWytJAM",
    "https://media.6529.io/ipfs/QmeDsW26YAivUJkBeaPNXL5noD6QshdFzdMZjSHJ6eXVbi/1.png",
    "https://media.6529.io/ipns/example.eth/cover.png",
    "https://ipfs.6529.io/ipfs/QmeDsW26YAivUJkBeaPNXL5noD6QshdFzdMZjSHJ6eXVbi",
    "https://ipfs.io/ipfs/QmeDsW26YAivUJkBeaPNXL5noD6QshdFzdMZjSHJ6eXVbi/1.png",
    "https://cloudflare-ipfs.com/ipns/example.eth/cover.png",
    "https://arweave.net/Jv9qMwx8lfuPMch9S_aBFk9-ENL1lWtbEV4zqWytJAM",
    "https://gateway.arweave.net/Jv9qMwx8lfuPMch9S_aBFk9-ENL1lWtbEV4zqWytJAM",
    "https://ar-io.net/Jv9qMwx8lfuPMch9S_aBFk9-ENL1lWtbEV4zqWytJAM",
    "https://txsubdomainexample.arweave.net/image.png",
    "https://txsubdomainexample.ar.io/image.png",
    "https://txsubdomainexample.gateway.ar.io/image.png",
    "https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.dweb.link/1.png",
    "https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.nftstorage.link/1.png",
    "https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.cf-ipfs.com/1.png",
  ])("allows the supported media source %s", (url) => {
    expect(isOptimizable(url)).toBe(true);
  });

  it.each([
    // Gateway and resolver paths outside the generated URL shapes.
    "https://media.6529.io/api/media/resolve",
    "https://ipfs.io/some/other/image.png",
    "https://ipfs.6529.io/image.png",
    "https://cf-ipfs.com/ipfsx/QmeDsW26YAivUJkBeaPNXL5noD6QshdFzdMZjSHJ6eXVbi",
    // Subdomain wildcards allow one label only.
    "https://a.b.arweave.net/image.png",
    "https://a.b.ar.io/image.png",
    "https://a.b.ipfs.dweb.link/1.png",
    "https://a.b.ipfs.nftstorage.link/1.png",
    // The gateway host itself must be the registrable suffix.
    "https://arweave.net.evil.example/image.png",
    "https://evilarweave.net/image.png",
    "https://bafy.ipfs.dweb.link.evil.example/1.png",
    "https://evil.example/ipfs/QmeDsW26YAivUJkBeaPNXL5noD6QshdFzdMZjSHJ6eXVbi",
    // Protocol and port stay locked.
    "http://ipfs.io/ipfs/QmeDsW26YAivUJkBeaPNXL5noD6QshdFzdMZjSHJ6eXVbi",
    "http://media.6529.io/ipfs/QmeDsW26YAivUJkBeaPNXL5noD6QshdFzdMZjSHJ6eXVbi",
    "https://media.6529.io:8443/ipfs/QmeDsW26YAivUJkBeaPNXL5noD6QshdFzdMZjSHJ6eXVbi",
  ])("rejects the unsupported media source %s", (url) => {
    expect(isOptimizable(url)).toBe(false);
  });

  it("scopes a configured media resolver host to resolver paths", () => {
    const env = {
      ...publicEnv,
      MEDIA_RESOLVER_ENDPOINT: "https://resolver.staging.example",
    } as PublicEnv;

    expect(
      isOptimizable("https://resolver.staging.example/ipfs/QmExample", env)
    ).toBe(true);
    expect(
      isOptimizable("https://resolver.staging.example/arweave/example", env)
    ).toBe(true);
    expect(isOptimizable("https://resolver.staging.example/admin", env)).toBe(
      false
    );
  });

  it("no longer uses multi-level subdomain wildcards", () => {
    const hostnames = patternsFor().flatMap((pattern) =>
      "hostname" in pattern ? [pattern.hostname] : []
    );

    expect(hostnames.filter((hostname) => hostname.startsWith("**."))).toEqual(
      []
    );
  });
});
