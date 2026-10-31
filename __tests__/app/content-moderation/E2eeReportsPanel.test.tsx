import E2eeReportsPanel from "@/app/content-moderation/E2eeReportsPanel";
import {
  MAX_EVIDENCE_BASE64_LENGTH,
  readE2eeReportEvidence,
} from "@/app/content-moderation/E2eeReportDetail";
import type { ApiE2eeTrustAndSafetyReport } from "@/generated/models/ApiE2eeTrustAndSafetyReport";
import {
  fetchE2eeReport,
  fetchE2eeReports,
  setE2eeReportHold,
} from "@/services/api/e2ee-reports-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/api/e2ee-reports-api", () => ({
  fetchE2eeReports: jest.fn(),
  fetchE2eeReport: jest.fn(),
  setE2eeReportHold: jest.fn(),
}));

const mockFetchReports = jest.mocked(fetchE2eeReports);
const mockFetchReport = jest.mocked(fetchE2eeReport);
const mockSetHold = jest.mocked(setE2eeReportHold);

const DAY = 24 * 60 * 60 * 1000;
const CREATED = Date.UTC(2026, 9, 31, 12, 0);

const b64 = (value: string) => Buffer.from(value, "utf8").toString("base64");

function aReport(
  overrides: Partial<ApiE2eeTrustAndSafetyReport> = {}
): ApiE2eeTrustAndSafetyReport {
  return {
    id: `0x${"1".repeat(32)}`,
    group: `0x${"2".repeat(64)}`,
    epoch: 3,
    category: "CREDIBLE_THREAT_OF_VIOLENCE",
    body: b64(
      JSON.stringify({
        v: 1,
        id: "a".repeat(32),
        ts: 1,
        t: "msg",
        text: "I know where you live",
        mentions: [],
      })
    ),
    signature: `0x${"3".repeat(128)}`,
    sender_device_key: `0x${"4".repeat(64)}`,
    sender_profile_id: "sender-profile",
    reporter_device_key: `0x${"5".repeat(64)}`,
    reporter_profile_id: "reporter-profile",
    notes: "please look",
    verified: true,
    on_hold: false,
    created_at: CREATED,
    expires_at: CREATED + 180 * DAY,
    ...overrides,
  };
}

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <E2eeReportsPanel profileId="moderator-1" />
    </QueryClientProvider>
  );
}

describe("E2eeReportsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists reports by category, time and status without showing evidence", async () => {
    mockFetchReports.mockResolvedValue({
      items: [
        aReport(),
        aReport({
          id: `0x${"6".repeat(32)}`,
          category: "DOXXING",
          verified: false,
          on_hold: true,
          expires_at: null,
        }),
      ],
      next_before: null,
      next_before_id: null,
    });
    renderPanel();

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      within(items[0]!).getByText("A credible threat of violence")
    ).toBeVisible();
    expect(within(items[0]!).getByText("Sender verified")).toBeVisible();
    expect(
      within(items[0]!).getByText(/^Deleted .* unless held$/)
    ).toBeVisible();
    expect(
      within(items[1]!).getByText("Doxxing or exposed personal data")
    ).toBeVisible();
    expect(within(items[1]!).getByText("Sender not verified")).toBeVisible();
    expect(within(items[1]!).getByText("On hold")).toBeVisible();
    expect(screen.queryByText("I know where you live")).not.toBeInTheDocument();
    expect(mockFetchReport).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Load more" })
    ).not.toBeInTheDocument();
  });

  it("pages with the (time, id) cursor from the previous page", async () => {
    const second = aReport({ id: `0x${"7".repeat(32)}` });
    mockFetchReports
      .mockResolvedValueOnce({
        items: [aReport()],
        next_before: CREATED,
        next_before_id: aReport().id,
      })
      .mockResolvedValueOnce({
        items: [second],
        next_before: null,
        next_before_id: null,
      });
    renderPanel();

    await userEvent.click(
      await screen.findByRole("button", { name: "Load more" })
    );
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(2)
    );
    expect(mockFetchReports).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cursor: { before: CREATED, beforeId: aReport().id },
      })
    );
  });

  it("opens the evidence with its scope and signature state, and toggles the hold", async () => {
    const report = aReport();
    mockFetchReports.mockResolvedValue({
      items: [report],
      next_before: null,
      next_before_id: null,
    });
    mockFetchReport.mockResolvedValue(report);
    mockSetHold.mockResolvedValue({
      ...report,
      on_hold: true,
      expires_at: null,
    });
    renderPanel();

    await userEvent.click(
      await screen.findByRole("button", {
        name: /^Review evidence: A credible threat of violence, reported /,
      })
    );
    const heading = await screen.findByRole("heading", {
      level: 2,
      name: "A credible threat of violence",
    });
    expect(heading).toHaveFocus();
    expect(mockFetchReport).toHaveBeenCalledTimes(1);
    expect(mockFetchReport.mock.calls[0]![0]).toBe(report.id);
    expect(
      await screen.findByText("Only what the reporter chose to share")
    ).toBeVisible();
    expect(screen.getByText(/It is not the chat/)).toBeVisible();
    expect(screen.getByText("I know where you live")).toBeVisible();
    expect(screen.getByText(/^Signature verified:/)).toBeVisible();
    expect(screen.getByText("please look")).toBeVisible();
    expect(screen.getByText("sender-profile")).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Place on hold" })
    );
    expect(mockSetHold).toHaveBeenCalledWith(report.id, true);
    expect(
      await screen.findByRole("button", { name: "Release hold" })
    ).toBeVisible();
    expect(screen.getByText("On hold: kept until released")).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Back to encrypted reports" })
    );
    const reviewButton = await screen.findByRole("button", {
      name: /^Review evidence: /,
    });
    expect(reviewButton).toHaveFocus();
    // The list shows the new hold without fetching (and logging) it again.
    expect(screen.getByText("On hold")).toBeVisible();
    expect(mockFetchReports).toHaveBeenCalledTimes(1);
  });

  it("marks an unverified report and reports a failed hold change", async () => {
    const report = aReport({ verified: false });
    mockFetchReports.mockResolvedValue({
      items: [report],
      next_before: null,
      next_before_id: null,
    });
    mockFetchReport.mockResolvedValue(report);
    mockSetHold.mockRejectedValue(new Error("nope"));
    renderPanel();

    await userEvent.click(
      await screen.findByRole("button", { name: /^Review evidence: / })
    );
    expect(await screen.findByText(/^Signature not verified:/)).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Place on hold" })
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Couldn’t change the hold. Please try again."
      )
    );
  });

  it("shows an empty state and a retryable error", async () => {
    mockFetchReports.mockRejectedValueOnce(new Error("forbidden"));
    mockFetchReports.mockResolvedValueOnce({
      items: [],
      next_before: null,
      next_before_id: null,
    });
    renderPanel();
    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No encrypted reports.")).toBeVisible();
  });

  it("keeps one polite status region mounted before, during and after loading", async () => {
    let resolveList: (
      page: Awaited<ReturnType<typeof fetchE2eeReports>>
    ) => void = () => undefined;
    mockFetchReports.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      })
    );
    renderPanel();
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Loading encrypted reports…");

    resolveList({
      items: [aReport()],
      next_before: null,
      next_before_id: null,
    });
    await screen.findByRole("button", { name: /^Review evidence: / });
    // The same node, now idle and empty: its text changes, it never remounts.
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("");

    // The detail announces through the region that existed before it loaded.
    let resolveReport: (report: ApiE2eeTrustAndSafetyReport) => void = () =>
      undefined;
    mockFetchReport.mockReturnValue(
      new Promise((resolve) => {
        resolveReport = resolve;
      })
    );
    mockSetHold.mockResolvedValue({
      ...aReport(),
      on_hold: true,
      expires_at: null,
    });
    await userEvent.click(
      screen.getByRole("button", { name: /^Review evidence: / })
    );
    expect(screen.getByRole("status")).toBe(status);
    await waitFor(() => expect(status).toHaveTextContent("Loading evidence…"));
    resolveReport(aReport());
    await screen.findByText("I know where you live");
    await waitFor(() => expect(status).toHaveTextContent(""));
    await userEvent.click(
      screen.getByRole("button", { name: "Place on hold" })
    );
    await waitFor(() =>
      expect(status).toHaveTextContent("Report placed on hold.")
    );
    expect(screen.getByRole("status")).toBe(status);
  });

  it("announces a repeated load failure again after each retry", async () => {
    let rejectRetry: (error: Error) => void = () => undefined;
    mockFetchReports
      .mockRejectedValueOnce(new Error("down"))
      .mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          rejectRetry = reject;
        })
      );
    renderPanel();
    const alert = screen.getByRole("alert");
    await waitFor(() =>
      expect(alert).toHaveTextContent("Couldn't load WatchTower.")
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    // Cleared while the retry runs, so the same message is announced again.
    await waitFor(() => expect(alert).toHaveTextContent(""));
    rejectRetry(new Error("still down"));
    await waitFor(() =>
      expect(alert).toHaveTextContent("Couldn't load WatchTower.")
    );
    expect(screen.getByRole("alert")).toBe(alert);
  });
});

describe("readE2eeReportEvidence", () => {
  it("refuses a body larger than the server's report cap before decoding", () => {
    expect(
      readE2eeReportEvidence("A".repeat(MAX_EVIDENCE_BASE64_LENGTH + 4))
    ).toEqual({ readable: false, text: "", attachments: [] });
  });

  it("reads a message payload's text and attachment names, not its keys", () => {
    const body = b64(
      JSON.stringify({
        v: 1,
        id: "b".repeat(32),
        ts: 2,
        t: "msg",
        text: "look",
        mentions: [],
        att: [
          {
            blob: `0x${"8".repeat(32)}`,
            k: "a2V5a2V5a2V5a2V5a2V5a2V5a2V5a2V5a2V5a2U=",
            n: "bm9uY2Vub25jZQ==",
            chunks: 1,
            mime: "image/png",
            size: 10,
            name: "photo.png",
          },
        ],
      })
    );
    expect(readE2eeReportEvidence(body)).toEqual({
      readable: true,
      text: "look",
      attachments: ["photo.png"],
    });
  });

  it("falls back to a bare text field or plain text, and flags unreadable bytes", () => {
    expect(readE2eeReportEvidence(b64('{"text":"bare"}'))).toEqual({
      readable: true,
      text: "bare",
      attachments: [],
    });
    expect(readE2eeReportEvidence(b64("just words"))).toEqual({
      readable: true,
      text: "just words",
      attachments: [],
    });
    expect(
      readE2eeReportEvidence(Buffer.from([0xff, 0xfe, 0xfd]).toString("base64"))
    ).toEqual({ readable: false, text: "", attachments: [] });
  });
});
