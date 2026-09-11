import {
  getAppEnvironment,
  getBrowserAppEnvironment,
  getBrowserOrigin,
  getProductionAppEnvironment,
  PRODUCTION_APP_ORIGIN,
} from "@/config/appEnvironment";

const PRODUCTION_ENVIRONMENT = {
  hostname: "6529.io",
  host: "6529.io",
  isProduction: true,
  title: "6529.io",
  badge: null,
  favicon: "/favicon.svg",
  faviconFallback: "/favicon.png",
};

describe("getAppEnvironment", () => {
  it.each(["https://6529.io", "https://www.6529.io"])(
    "treats %s as production",
    (baseEndpoint) => {
      expect(getAppEnvironment(baseEndpoint)).toEqual({
        hostname: new URL(baseEndpoint).hostname,
        host: new URL(baseEndpoint).host,
        isProduction: true,
        title: "6529.io",
        badge: null,
        favicon: "/favicon.svg",
        faviconFallback: "/favicon.png",
      });
    }
  );

  it.each(["", "not-a-url"])(
    "falls back to production identity for invalid endpoint %p",
    (baseEndpoint) => {
      expect(getAppEnvironment(baseEndpoint)).toEqual(PRODUCTION_ENVIRONMENT);
    }
  );

  it.each(["file:///tmp/index.html", "data:text/plain,6529", "mailto:6529.io"])(
    "falls back to production identity for unsupported URL %p",
    (url) => {
      expect(getAppEnvironment(url)).toEqual(PRODUCTION_ENVIRONMENT);
    }
  );

  it("formats the shared staging environment", () => {
    expect(getAppEnvironment("https://staging.6529.io")).toEqual({
      hostname: "staging.6529.io",
      host: "staging.6529.io",
      isProduction: false,
      title: "6529 Staging",
      badge: "STG",
      favicon: "/favicon-staging.svg",
      faviconFallback: "/favicon-staging.png",
    });
  });

  it.each([
    ["prxtstaging", "6529 PRXTStaging", "PRXTSTG"],
    ["alicestaging", "6529 ALICEStaging", "ALICESTG"],
    ["bobstaging", "6529 BOBStaging", "BOBSTG"],
  ])(
    "derives personal staging identity for %s without named environment configuration",
    (subdomain, title, badge) => {
      expect(getAppEnvironment(`https://${subdomain}.6529.io`)).toEqual({
        hostname: `${subdomain}.6529.io`,
        host: `${subdomain}.6529.io`,
        isProduction: false,
        title,
        badge,
        favicon: "/favicon-alt.svg",
        faviconFallback: "/favicon-alt.png",
      });
    }
  );

  it("derives other non-production environments from the first hostname label", () => {
    expect(getAppEnvironment("https://preview.6529.io")).toEqual({
      hostname: "preview.6529.io",
      host: "preview.6529.io",
      isProduction: false,
      title: "6529 Preview",
      badge: "PREVIEW",
      favicon: "/favicon-alt.svg",
      faviconFallback: "/favicon-alt.png",
    });
  });

  it.each([
    ["http://localhost:3001", "LCL:3001"],
    ["http://127.0.0.1:3001", "LCL:3001"],
    ["http://localhost", "LCL"],
  ])("formats local environment %s", (baseEndpoint, badge) => {
    expect(getAppEnvironment(baseEndpoint)).toMatchObject({
      isProduction: false,
      title: "6529 Localhost",
      badge,
      favicon: "/favicon-alt.svg",
      faviconFallback: "/favicon-alt.png",
    });
  });
});

describe("browser environment identity", () => {
  it.each([
    [
      "https://6529.io",
      {
        hostname: "6529.io",
        host: "6529.io",
        badge: null,
        favicon: "/favicon.svg",
        faviconFallback: "/favicon.png",
      },
    ],
    [
      "https://www.6529.io",
      {
        hostname: "www.6529.io",
        host: "www.6529.io",
        badge: null,
        favicon: "/favicon.svg",
        faviconFallback: "/favicon.png",
      },
    ],
    [
      "https://staging.6529.io",
      {
        hostname: "staging.6529.io",
        host: "staging.6529.io",
        badge: "STG",
        favicon: "/favicon-staging.svg",
        faviconFallback: "/favicon-staging.png",
      },
    ],
    [
      "https://prxtstaging.6529.io",
      {
        hostname: "prxtstaging.6529.io",
        host: "prxtstaging.6529.io",
        badge: "PRXTSTG",
        favicon: "/favicon-alt.svg",
        faviconFallback: "/favicon-alt.png",
      },
    ],
    [
      "https://alicestaging.6529.io",
      {
        hostname: "alicestaging.6529.io",
        host: "alicestaging.6529.io",
        badge: "ALICESTG",
        favicon: "/favicon-alt.svg",
        faviconFallback: "/favicon-alt.png",
      },
    ],
    [
      "http://localhost:3001",
      {
        hostname: "localhost",
        host: "localhost:3001",
        badge: "LCL:3001",
        favicon: "/favicon-alt.svg",
        faviconFallback: "/favicon-alt.png",
      },
    ],
    [
      "http://localhost",
      {
        hostname: "localhost",
        host: "localhost",
        badge: "LCL",
        favicon: "/favicon-alt.svg",
        faviconFallback: "/favicon-alt.png",
      },
    ],
  ])("derives browser identity from %s", (origin, expected) => {
    expect(getBrowserOrigin(() => origin)).toBe(new URL(origin).origin);
    expect(getBrowserAppEnvironment(() => origin)).toMatchObject(expected);
  });

  it.each([
    ["unavailable", () => undefined],
    ["empty", () => ""],
    ["malformed", () => "not-a-url"],
    ["unsupported", () => "file:///tmp/index.html"],
    [
      "inaccessible",
      () => {
        throw new Error("location access denied");
      },
    ],
  ])("uses the complete production fallback when location is %s", (_, read) => {
    expect(getBrowserOrigin(read)).toBe(PRODUCTION_APP_ORIGIN);
    expect(getBrowserAppEnvironment(read)).toEqual(PRODUCTION_ENVIRONMENT);
    expect(getBrowserAppEnvironment(read)).toEqual(
      getProductionAppEnvironment()
    );
  });
});
