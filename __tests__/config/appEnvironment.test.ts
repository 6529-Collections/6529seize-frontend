import { getAppEnvironment } from "@/config/appEnvironment";

describe("getAppEnvironment", () => {
  it.each(["https://6529.io", "https://www.6529.io"])(
    "treats %s as production",
    (baseEndpoint) => {
      expect(getAppEnvironment(baseEndpoint)).toEqual({
        hostname: new URL(baseEndpoint).hostname,
        isProduction: true,
        title: "6529.io",
        badge: null,
        favicon: "/favicon.ico",
      });
    }
  );

  it("formats the shared staging environment", () => {
    expect(getAppEnvironment("https://staging.6529.io")).toEqual({
      hostname: "staging.6529.io",
      isProduction: false,
      title: "6529 Staging",
      badge: "STG",
      favicon: "/favicon-staging.ico",
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
        isProduction: false,
        title,
        badge,
        favicon: "/favicon-alt.ico",
      });
    }
  );

  it("derives other non-production environments from the first hostname label", () => {
    expect(getAppEnvironment("https://preview.6529.io")).toEqual({
      hostname: "preview.6529.io",
      isProduction: false,
      title: "6529 Preview",
      badge: "PREVIEW",
      favicon: "/favicon-alt.ico",
    });
  });

  it.each([
    ["http://localhost:3001", "LOCAL:3001"],
    ["http://127.0.0.1:3001", "LOCAL:3001"],
    ["http://localhost", "LOCAL"],
  ])("formats local environment %s", (baseEndpoint, badge) => {
    expect(getAppEnvironment(baseEndpoint)).toMatchObject({
      isProduction: false,
      title: "6529 Localhost",
      badge,
      favicon: "/favicon-alt.ico",
    });
  });
});
