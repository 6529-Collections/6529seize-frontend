import {
  clearSubmissionRequestKeys,
  prepareSubmissionRequestKey,
} from "@/services/api/submission-request-key";

beforeEach(clearSubmissionRequestKeys);
it("keeps a stable key for an unknown response, then starts a new submission after success", () => {
  const first = prepareSubmissionRequestKey(
    "drops",
    { text: "same" },
    () => "wallet:profile"
  );
  expect(first).not.toBeNull();
  expect(
    prepareSubmissionRequestKey(
      "drops",
      { text: "same" },
      () => "wallet:profile"
    )?.key
  ).toBe(first?.key);
  first?.complete();
  expect(
    prepareSubmissionRequestKey(
      "drops",
      { text: "same" },
      () => "wallet:profile"
    )?.key
  ).not.toBe(first?.key);
});
it("separates edited content and identities and covers every approved submission route", () => {
  for (const endpoint of [
    "drops",
    "drops/drop-id",
    "profiles/profile-id/cic/statements",
    "groups/group-id/visible",
  ]) {
    const first = prepareSubmissionRequestKey(
      endpoint,
      { text: "one" },
      () => "wallet:profile"
    );
    expect(
      prepareSubmissionRequestKey(
        endpoint,
        { text: "two" },
        () => "wallet:profile"
      )?.key
    ).not.toBe(first?.key);
    expect(
      prepareSubmissionRequestKey(
        endpoint,
        { text: "one" },
        () => "wallet:proxy"
      )?.key
    ).not.toBe(first?.key);
  }
  expect(
    prepareSubmissionRequestKey(
      "drops/drop-id/ratings",
      {},
      () => "wallet:profile"
    )
  ).toBeNull();
});
it("forgets unresolved request keys on identity scope reset", () => {
  const first = prepareSubmissionRequestKey(
    "drops",
    {},
    () => "wallet:profile"
  );
  clearSubmissionRequestKeys();
  expect(
    prepareSubmissionRequestKey("drops", {}, () => "wallet:profile")?.key
  ).not.toBe(first?.key);
});
