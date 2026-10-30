import CaseReports from "@/app/content-moderation/checks/CaseReports";
import { fetchContentModerationQueue } from "@/services/api/content-moderation-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiContentModerationQueueItem } from "@/generated/models/ApiContentModerationQueueItem";
import { readCheckFilters } from "@/app/content-moderation/checks/checks.helpers";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/content-moderation-api", () => ({
  fetchContentModerationQueue: jest.fn(),
}));
const caseId = "a".repeat(64);

it("scopes report evidence to its case, including notes and direct report selection", async () => {
  jest
    .mocked(fetchContentModerationQueue)
    .mockResolvedValue([
      {
        id: "report-1",
        author_profile_id: "author",
        author_handle: "writer",
        reporter_profile_id: "reporter",
        reporter_handle: "reader",
        reason: "SPAM",
        notes: "Why this needs review",
      } as ApiContentModerationQueueItem,
    ]);
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CaseReports caseId={caseId} profileId="moderator" />
    </QueryClientProvider>
  );
  expect(fetchContentModerationQueue).not.toHaveBeenCalled();
  await userEvent.click(screen.getByText("User reports for this case"));
  expect(await screen.findByText("Why this needs review")).toBeVisible();
  await waitFor(() =>
    expect(fetchContentModerationQueue).toHaveBeenCalledWith({
      case_id: caseId,
      limit: 50,
      view: "OPEN",
      signal: expect.any(AbortSignal),
    })
  );
  const target = new URL(
    screen.getByRole("link", { name: "Review report" }).getAttribute("href")!,
    "https://example.com"
  );
  expect(target.searchParams.get("case_id")).toBe(caseId);
  expect(target.searchParams.get("report")).toBe("report-1");
});

it("accepts only an opaque case filter and retains it alongside pending-review status", () => {
  expect(
    readCheckFilters(
      new URLSearchParams({ case_id: caseId, review_status: "NEEDS_REVIEW" })
    )
  ).toEqual({ case_id: caseId, review_status: "NEEDS_REVIEW" });
  expect(
    readCheckFilters(new URLSearchParams({ case_id: "private category text" }))
  ).toEqual({});
});
