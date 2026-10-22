import { useEffect, useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import ModerationChecks from "@/app/content-moderation/checks/ModerationChecks";
import {
  fetchModerationChecks,
  fetchModerationReviewCases,
  fetchModerationCheck,
  fetchModerationReportCheck,
} from "@/services/api/moderation-checks-api";
import { fetchContentModerationQueue } from "@/services/api/content-moderation-api";
import {
  type ApiModerationReviewCase,
  ApiModerationReviewCaseCheckOutcomeEnum,
} from "@/generated/models/ApiModerationReviewCase";
import { ApiModerationCheckSubjectTypeEnum } from "@/generated/models/ApiModerationCheck";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { checkFixture } from "./check.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/moderation-checks-api", () => ({
  fetchModerationChecks: jest.fn(),
  fetchModerationReviewCases: jest.fn(),
  fetchModerationCheck: jest.fn(),
  fetchModerationReportCheck: jest.fn(),
}));
jest.mock("@/services/api/content-moderation-api", () => ({
  fetchContentModerationQueue: jest.fn(),
}));
jest.mock("@/app/content-moderation/checks/CheckDetail", () => ({
  __esModule: true,
  default: function Detail({
    id,
    onClose,
    caseContext,
  }: {
    id: string;
    caseContext?: React.ReactNode;
    onClose: () => void;
  }) {
    return (
      <aside aria-label="Case detail">
        <span>{id}</span>
        {caseContext}
        <button onClick={onClose}>Back to list</button>
      </aside>
    );
  },
}));
const caseId = "a".repeat(64);
function fixture(
  overrides: Partial<ApiModerationReviewCase> = {}
): ApiModerationReviewCase {
  return {
    id: caseId,
    subject_type: "DROP",
    open_report_count: 1,
    pending_check_count: 3,
    check_id: "post-check",
    report_id: "report-1",
    created_at: 1,
    preview: "Saved deleted post preview",
    drop_id: "deleted-post",
    wave_id: "demo-wave",
    drop_deleted: true,
    check_outcome: "ALLOW",
    report_reason: "OTHER",
    ...overrides,
  } as ApiModerationReviewCase;
}
const rep = fixture({
  id: "b".repeat(64),
  subject_type: "REP_CATEGORY" as ApiModerationReviewCase["subject_type"],
  drop_id: null,
  wave_id: null,
  drop_deleted: false,
  open_report_count: 0,
  pending_check_count: 1,
  report_id: null,
  check_id: "rep-check",
  preview: "Category awaiting review",
  check_outcome: ApiModerationReviewCaseCheckOutcomeEnum.Reject,
});
const reportOnly = fixture({
  id: "c".repeat(64),
  drop_id: "other-post",
  preview: "Report-only case",
  pending_check_count: 0,
  check_id: null,
  report_id: "report-only",
  drop_deleted: false,
});
let rows: ApiModerationReviewCase[];
function Harness({ client }: { client: QueryClient }) {
  const [params, setParams] = useState(
    () => new URLSearchParams(globalThis.location.search)
  );
  useEffect(() => {
    const original = globalThis.history.pushState.bind(globalThis.history);
    const spy = jest
      .spyOn(globalThis.history, "pushState")
      .mockImplementation((...args) => {
        original(...args);
        setParams(new URLSearchParams(globalThis.location.search));
      });
    return () => spy.mockRestore();
  }, []);
  return (
    <QueryClientProvider client={client}>
      <SearchParamsContext.Provider value={params}>
        {globalThis.location.pathname === "/content-moderation/needs-review" ? (
          <button id={`review-case-${"b".repeat(64)}`}>Returned case</button>
        ) : (
          <ModerationChecks profileId="moderator" />
        )}
      </SearchParamsContext.Provider>
    </QueryClientProvider>
  );
}
function mount(
  url = `/content-moderation/checks?review_status=NEEDS_REVIEW&case_id=${caseId}&report=report-1`
) {
  globalThis.history.replaceState(null, "", url);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(<Harness client={client} />);
  return client;
}
beforeEach(() => {
  jest.clearAllMocks();
  rows = [fixture(), rep, reportOnly];
  jest
    .mocked(fetchModerationReviewCases)
    .mockImplementation(async () => ({ items: rows, next_cursor: null }));
  jest
    .mocked(fetchModerationChecks)
    .mockResolvedValue({ items: [], next_cursor: null });
  jest.mocked(fetchContentModerationQueue).mockResolvedValue([]);
  const detailForSelection = async (id: string) => {
    const detail = checkFixture();
    detail.check.id = id === "rep-check" ? "rep-check" : "post-check";
    detail.check.subject_type = ApiModerationCheckSubjectTypeEnum.Drop;
    detail.check.published_subject_id =
      id === "rep-check" ? null : "deleted-post";
    return detail;
  };
  jest.mocked(fetchModerationCheck).mockImplementation(detailForSelection);
  jest
    .mocked(fetchModerationReportCheck)
    .mockImplementation(detailForSelection);
});
it("shows the entire unique-case queue beside a highlighted report selection, including report-only work", async () => {
  mount();
  const post = await screen.findByRole("button", {
    name: /Saved deleted post preview/,
  });
  expect(post).toHaveAttribute("aria-current", "true");
  expect(within(post).getByText("Deleted")).toBeVisible();
  expect(
    screen.getByRole("button", { name: /Category awaiting review/ })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: /Report-only case/ })
  ).toBeVisible();
  expect(screen.getAllByText("Saved deleted post preview")).toHaveLength(1);
  expect(
    within(post).getByText("Open reports: 1 · Checks needing review: 3")
  ).toBeVisible();
  expect(within(post).getByText("Automated outcome: Allowed")).toBeVisible();
  expect(
    screen.queryByRole("link", { name: "Open original post" })
  ).not.toBeInTheDocument();
  expect(fetchModerationReviewCases).toHaveBeenCalledWith(
    undefined,
    expect.any(AbortSignal)
  );
  await waitFor(() =>
    expect(fetchModerationChecks).toHaveBeenCalledWith(
      { case_id: caseId, review_status: "NEEDS_REVIEW" },
      undefined,
      expect.any(AbortSignal)
    )
  );
  expect(fetchContentModerationQueue).toHaveBeenCalledWith(
    expect.objectContaining({ case_id: caseId })
  );
});
it("switches selected cases without narrowing the left queue and returns to Needs review", async () => {
  mount();
  const repButton = await screen.findByRole("button", {
    name: /Category awaiting review/,
  });
  fireEvent.click(repButton);
  expect(repButton).toHaveAttribute("aria-current", "true");
  expect(
    screen.getByRole("button", { name: /Saved deleted post preview/ })
  ).not.toHaveAttribute("aria-current");
  expect(
    within(screen.getByLabelText("Case detail")).getByText("rep-check")
  ).toBeVisible();
  expect(
    new URLSearchParams(globalThis.location.search).get("report")
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Back to list" }));
  expect(globalThis.location.pathname).toBe("/content-moderation/needs-review");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Returned case" })).toHaveFocus()
  );
});
it("retains report-only work after its check is reviewed and removes a resolved case on refresh", async () => {
  const client = mount();
  await screen.findByRole("button", { name: /Saved deleted post preview/ });
  rows = [fixture({ pending_check_count: 0, check_id: null }), rep, reportOnly];
  await act(() =>
    client.invalidateQueries({ queryKey: MODERATION_CHECKS_QUERY_KEY })
  );
  expect(
    screen.getByRole("button", { name: /Saved deleted post preview/ })
  ).toHaveAttribute("aria-current", "true");
  expect(
    within(
      screen.getByRole("button", { name: /Saved deleted post preview/ })
    ).getByText("Open reports: 1 · Checks needing review: 0")
  ).toBeVisible();
  rows = [rep, reportOnly];
  await act(() =>
    client.invalidateQueries({ queryKey: MODERATION_CHECKS_QUERY_KEY })
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: /Saved deleted post preview/ })
    ).not.toBeInTheDocument()
  );
  expect(
    screen.getByRole("button", { name: /Category awaiting review/ })
  ).toBeVisible();
});
it("resolves a direct non-representative report selection to the post case without case_id", async () => {
  mount(
    "/content-moderation/checks?review_status=NEEDS_REVIEW&report=another-report-for-post"
  );
  const post = await screen.findByRole("button", {
    name: /Saved deleted post preview/,
  });
  await waitFor(() => expect(post).toHaveAttribute("aria-current", "true"));
  expect(
    screen.getByRole("button", { name: /Category awaiting review/ })
  ).toBeVisible();
});
it("keeps filter disclosure and drafts while switching between history and the case queue", async () => {
  mount("/content-moderation/checks");
  const toggle = screen.getByRole("switch", { name: "Needs review only" });
  const disclosure = screen.getByRole("button", { name: "Filter checks" });
  expect(toggle).not.toBeChecked();
  fireEvent.click(disclosure);
  fireEvent.change(screen.getByLabelText("Profile ID"), {
    target: { value: "draft-author" },
  });
  fireEvent.click(toggle);
  await screen.findByRole("button", { name: /Report-only case/ });
  expect(toggle).toBeChecked();
  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByLabelText("Profile ID")).toHaveValue("draft-author");
  expect(
    new URLSearchParams(globalThis.location.search).has("profile_id")
  ).toBe(false);
  fireEvent.click(toggle);
  expect(globalThis.location.search).toBe("");
  expect(toggle).not.toBeChecked();
  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByLabelText("Profile ID")).toHaveValue("draft-author");
});
