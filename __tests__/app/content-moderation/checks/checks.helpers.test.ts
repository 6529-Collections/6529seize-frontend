import { readCheckFilters } from "@/app/content-moderation/checks/checks.helpers";

it("retains a case's validated pending-work filters and inclusive UTC date boundaries", () => {
  const caseId = "b".repeat(64);
  expect(
    readCheckFilters(
      new URLSearchParams({
        case_id: caseId,
        review_status: "NEEDS_REVIEW",
        subject_type: "DROP",
        profile_id: "author-1",
        subject_id: "drop-1",
        from: "2026-10-21",
        to: "2026-10-21",
      })
    )
  ).toEqual({
    case_id: caseId,
    review_status: "NEEDS_REVIEW",
    subject_type: "DROP",
    profile_id: "author-1",
    subject_id: "drop-1",
    from: Date.UTC(2026, 9, 21),
    to: Date.UTC(2026, 9, 21, 23, 59, 59, 999),
  });
});

it("ignores malformed dates, unknown enum values and unsafe subject identifiers", () => {
  expect(
    readCheckFilters(
      new URLSearchParams({
        case_id: "private category text",
        review_status: "UNKNOWN",
        outcome: "unknown",
        profile_id: "../other",
        subject_id: "https://example.com",
        from: "2026/10/21",
        to: "9999-99-99",
      })
    )
  ).toEqual({});
});

it("does not turn missing date boundaries into timestamps", () => {
  expect(readCheckFilters(new URLSearchParams())).toEqual({});
});
