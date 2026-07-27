import {
  getPublicReviewEnvironment,
  isPublicReviewEnabled,
} from "@/config/publicReviews";

describe("public review environment gate", () => {
  it.each([
    ["http://localhost:3101", "local"],
    ["http://127.0.0.1:3001", "local"],
    ["https://staging.6529.io", "staging"],
  ] as const)("enables %s as %s", (endpoint, environment) => {
    expect(getPublicReviewEnvironment(endpoint)).toBe(environment);
    expect(isPublicReviewEnabled(endpoint)).toBe(true);
  });

  it.each([
    "https://6529.io",
    "https://www.6529.io",
    "https://test.6529.io",
    "https://staging.6529.io.evil.example",
    "not-a-url",
  ])("fails closed for %s", (endpoint) => {
    expect(getPublicReviewEnvironment(endpoint)).toBe("disabled");
    expect(isPublicReviewEnabled(endpoint)).toBe(false);
  });
});
