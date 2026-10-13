import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";

const publicEnv = {
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
} as PublicEnv;

describe("shared Next config", () => {
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

  it("excludes public-review inputs from production traces", () => {
    expect(sharedConfig(publicEnv, "").outputFileTracingExcludes).toEqual({
      "/*": ["content/public-reviews/**/*", "public/review-data/**/*"],
    });
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

  it("lets staging packaging inject canonical public-review inputs", () => {
    const stagingEnv = {
      ...publicEnv,
      BASE_ENDPOINT: "https://staging.6529.io",
    };

    expect(sharedConfig(stagingEnv, "").outputFileTracingExcludes).toEqual({
      "/*": ["content/public-reviews/**/*", "public/review-data/**/*"],
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
