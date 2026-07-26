import { publicEnvSchema } from "@/config/env.schema";
import {
  PUBLIC_REVIEW_DESTINATIONS_ENV,
  resolvePublicReviewDiscussionDestination,
} from "@/services/api/public-review/destination.server";

jest.mock("next/dist/compiled/server-only", () => ({}));

const LOCAL_WAVE_ID = "11111111-1111-4111-8111-111111111111";
const STAGING_WAVE_ID = "22222222-2222-4222-8222-222222222222";
const PRODUCTION_SENTINEL = "33333333-3333-4333-8333-333333333333";

describe("public review destination resolution", () => {
  const originalValue = process.env[PUBLIC_REVIEW_DESTINATIONS_ENV];

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env[PUBLIC_REVIEW_DESTINATIONS_ENV];
    } else {
      process.env[PUBLIC_REVIEW_DESTINATIONS_ENV] = originalValue;
    }
  });

  it("resolves only the requested environment destination", () => {
    process.env[PUBLIC_REVIEW_DESTINATIONS_ENV] = JSON.stringify({
      local: { "stream-review": LOCAL_WAVE_ID },
      staging: { "stream-review": STAGING_WAVE_ID },
      production: { "stream-review": PRODUCTION_SENTINEL },
    });

    const destination = resolvePublicReviewDiscussionDestination({
      environment: "staging",
      logicalKey: "stream-review",
    });

    expect(destination).toEqual({
      environment: "staging",
      logicalKey: "stream-review",
      waveId: STAGING_WAVE_ID,
    });
    expect(JSON.stringify(destination)).not.toContain(PRODUCTION_SENTINEL);
  });

  it("does not fall back to a destination from another environment", () => {
    process.env[PUBLIC_REVIEW_DESTINATIONS_ENV] = JSON.stringify({
      production: { "stream-review": PRODUCTION_SENTINEL },
    });

    expect(() =>
      resolvePublicReviewDiscussionDestination({
        environment: "staging",
        logicalKey: "stream-review",
      })
    ).toThrow("is not configured for staging");
  });

  it("rejects Wave IDs shared across environments", () => {
    process.env[PUBLIC_REVIEW_DESTINATIONS_ENV] = JSON.stringify({
      staging: { "stream-review": STAGING_WAVE_ID },
      production: { "stream-review": STAGING_WAVE_ID },
    });

    expect(() =>
      resolvePublicReviewDiscussionDestination({
        environment: "staging",
        logicalKey: "stream-review",
      })
    ).toThrow("cannot be shared across environments");
  });

  it("strips the server-only destination map from public runtime parsing", () => {
    const parsed = publicEnvSchema.partial().parse({
      [PUBLIC_REVIEW_DESTINATIONS_ENV]: PRODUCTION_SENTINEL,
    });

    expect(parsed).toEqual({});
    expect(JSON.stringify(parsed)).not.toContain(PRODUCTION_SENTINEL);
  });
});
