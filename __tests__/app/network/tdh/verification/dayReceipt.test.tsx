import { webcrypto } from "node:crypto";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TdhDayReceiptPage, {
  generateMetadata,
} from "@/app/network/tdh/verification/[cycleDay]/page";
import { serveFixtureFeed } from "./fixtureFeed";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/network/tdh/verification/20744",
  useSearchParams: () => ({ get: () => null }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const realFetch = globalThis.fetch;
const realCrypto = globalThis.crypto;

function page(cycleDay: string) {
  return TdhDayReceiptPage({
    params: Promise.resolve({ cycleDay }),
    searchParams: Promise.resolve({}),
  });
}

function withQueries(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>
  );
}

const ORDER = [
  "result",
  "snapshot",
  "verdict",
  "total",
  "differences",
  "history",
  "ruleVersion",
  "ruleId",
  "registry",
  "cycleRoot",
  "walletRoot",
  "historyRoot",
  "input",
  "records",
  "file",
];

// The pages read the reader's language from Accept-Language (the kit's
// resolveExplainedLocale); these tests read as an English browser.
jest.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "accept-language" ? "en-US" : null),
  }),
}));

describe("a day's receipt (TDH-DESIGN.md §4.5)", () => {
  beforeEach(() => {
    serveFixtureFeed();
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
  });
  afterAll(() => {
    globalThis.fetch = realFetch;
    Object.defineProperty(globalThis, "crypto", {
      value: realCrypto,
      configurable: true,
    });
  });

  it("prints the day's rows in their fixed order, each value a fact of that day", async () => {
    const { container } = withQueries(await page("20744"));
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The result dated October 18, 2026",
      })
    ).toBeInTheDocument();
    const rows = [...container.querySelectorAll("[data-receipt-row]")].map(
      (row) => row.getAttribute("data-receipt-row")
    );
    expect(rows).toEqual(ORDER);
    const facts = [...container.querySelectorAll("[data-receipt] [data-fact]")]
      .map((node) => node.getAttribute("data-fact") ?? "")
      .filter((id) => id.startsWith("tdh."));
    expect(facts.length).toBeGreaterThan(10);
    expect(facts.every((id) => id.startsWith("tdh.day.20744."))).toBe(true);
    const row = (id: string) =>
      container.querySelector(`[data-receipt-row="${id}"]`);
    expect(row("result")).toHaveTextContent("October 18, 2026 · cycle 20,744");
    expect(row("snapshot")).toHaveTextContent("26,215,721");
    expect(row("verdict")).toHaveTextContent(
      "Equal10,273 of 10,273 identities · 11,126 of 11,126 wallets"
    );
    expect(row("total")).toHaveTextContent(
      "Rust core = Python reference = 6529.io"
    );
    expect(row("differences")).toHaveTextContent("None, of any class");
    expect(row("history")).toHaveTextContent("Not yet checked");
  });

  it("prints the rule version as the file reports it, with the newer decisions on that row", async () => {
    const { container } = withQueries(await page("20744"));
    const version = container.querySelector('[data-receipt-row="ruleVersion"]');
    expect(version).toHaveTextContent("tdh-v1.0");
    expect(version).toHaveTextContent("as this file reports it");
    const drift = version?.querySelector("[data-drift-by]");
    expect(drift?.getAttribute("data-drift-by")).toBe("D136 D137");
    expect(drift).toHaveTextContent("P26's rule version is tdh-v1.4");
    expect(drift).toHaveTextContent("no compared identity had a fourth wallet");
    // The old registry is not the one vector 28 pins.
    expect(
      container.querySelector('[data-receipt-row="registry"]')
    ).not.toHaveTextContent("pinned by vector");
  });

  it("computes the file's SHA-256 in the browser and compares it with the index", async () => {
    const { container } = withQueries(await page("20744"));
    const file = container.querySelector('[data-receipt-row="file"]');
    await waitFor(() =>
      expect(file?.querySelector('[data-browser-hash="equal"]')).not.toBeNull()
    );
    expect(file).toHaveTextContent(
      "equals the index: your browser computed it from the 3,503 bytes of the file"
    );
  });

  it("links the result before and says the next day is open", async () => {
    withQueries(await page("20744"));
    const nav = screen.getByRole("navigation", { name: "Other days" });
    expect(
      within(nav).getByRole("link", {
        name: "The result before: October 17, 2026",
      })
    ).toHaveAttribute("href", "/network/tdh/verification/20743");
    expect(within(nav).getByText(/Oct 19/)).toBeInTheDocument();
    expect(within(nav).getAllByRole("link")).toHaveLength(1);
  });

  it("links both neighbours of a day in the middle, and its change since the day before", async () => {
    withQueries(await page("20742"));
    const nav = screen.getByRole("navigation", { name: "Other days" });
    expect(within(nav).getAllByRole("link")).toHaveLength(2);
    expect(
      screen.getByRole("region", { name: "The day at a glance" })
    ).toHaveTextContent("TDH, +2,930,220 since Oct 15");
  });

  it("copies the receipt as text, with every hash in full", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn(async (_text: string) => undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    withQueries(await page("20744"));
    await user.click(
      screen.getByRole("button", { name: "Copy the receipt as text" })
    );
    const text = writeText.mock.calls[0]?.[0] ?? "";
    expect(text).toMatch(/^The result dated October 18, 2026, cycle 20,744/);
    expect(text).toMatch(
      /This file: days\/20744\.json: SHA-256 1c01ed1d2c31391f74597894bb6eafe307f7da3447a6545bd49fd93be05b3a0a/
    );
    expect(text).toMatch(/Cycle root: 0x[0-9a-f]{64}/);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("answers not found for a day the index does not list", async () => {
    await expect(page("20739")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(page("abc")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(page("020744")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("says so when the index lists the day but its file cannot be read", async () => {
    serveFixtureFeed({
      "https://d379duzqnomz3w.cloudfront.net/days/20743.json": null,
    });
    const { container } = withQueries(await page("20743"));
    expect(container.querySelector('[data-verdict="missing"]')).not.toBeNull();
    expect(container.querySelector("[data-receipt]")).toBeNull();
  });

  it("titles the day by its date", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ cycleDay: "20744" }),
    });
    expect(metadata.title).toBe(
      "October 18, 2026 · The daily check · 6529 Explained"
    );
  });
});
