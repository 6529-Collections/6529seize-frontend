const {
  PROFILE_FIELDS,
  buildProfile,
}: {
  PROFILE_FIELDS: string[];
  buildProfile: (
    args: Record<string, string>,
    environment: Record<string, string>
  ) => Record<string, any>;
} = require("../../scripts/release-bus-build-profile.cjs");

describe("Release Bus protected frontend build profile", () => {
  const sourceSha = "a".repeat(40);
  const values = Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, `protected-${field}`])
  );
  values.VERSION = sourceSha;
  values.ANNOUNCED_VERSION_ENDPOINT = "";
  const environment = {
    ...values,
    RELEASE_BUS_BUILD_PROFILE_HMAC_KEY: "k".repeat(64),
  };

  it("is deterministic, opaque, and sensitive to every protected value", () => {
    const args = { "source-sha": sourceSha, environment: "staging" };
    const baseline = buildProfile(args, environment);

    expect(buildProfile(args, environment)).toEqual(baseline);
    expect(baseline).toMatchObject({
      schema_version: 1,
      kind: "release_bus_frontend_build_profile",
      environment: "staging",
      source_sha: sourceSha,
      node_version: "22",
      digest: expect.stringMatching(/^[a-f0-9]{64}$/),
      protected_fields: PROFILE_FIELDS,
    });
    expect(JSON.stringify(baseline)).not.toContain("protected-");

    for (const field of PROFILE_FIELDS) {
      if (field === "VERSION") continue;
      expect(
        buildProfile(args, {
          ...environment,
          [field]: `${environment[field]}-changed`,
        }).digest
      ).not.toBe(baseline.digest);
    }
  });

  it("distinguishes the production profile and rejects missing or drifted identity", () => {
    const staging = buildProfile(
      { "source-sha": sourceSha, environment: "staging" },
      environment
    );
    const production = buildProfile(
      { "source-sha": sourceSha, environment: "production" },
      {
        ...environment,
        API_ENDPOINT: "https://api.6529.io",
        ASSETS_FROM_S3: "true",
        ANNOUNCED_VERSION_ENDPOINT:
          "https://dnclu2fna0b2b.cloudfront.net/web_build/current-production-version.json",
      }
    );
    expect(production.digest).not.toBe(staging.digest);

    expect(() =>
      buildProfile(
        { "source-sha": sourceSha, environment: "staging" },
        Object.fromEntries(
          Object.entries(environment).filter(
            ([field]) => field !== "SENTRY_DSN"
          )
        )
      )
    ).toThrow("Build-profile field SENTRY_DSN is missing");
    expect(() =>
      buildProfile(
        { "source-sha": sourceSha, environment: "staging" },
        { ...environment, VERSION: "b".repeat(40) }
      )
    ).toThrow("Build-profile VERSION does not match source SHA");
  });
});
