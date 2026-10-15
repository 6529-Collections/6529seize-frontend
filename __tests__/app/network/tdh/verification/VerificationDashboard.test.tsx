import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerificationDashboard from "@/app/network/tdh/verification/components/VerificationDashboard";
import type {
  DayLoad,
  IndexLoad,
} from "@/lib/tdh/verification/loadVerification.server";
import { loadBundledSample } from "@/lib/tdh/verification/loadVerification.server";
import type { VerificationIndex } from "@/lib/tdh/verification/schema";
import {
  syntheticDay,
  syntheticIndex,
} from "../../../../lib/tdh/verification/fixtures";

const push = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => "/network/tdh/verification",
  useSearchParams: () => ({ get: () => null }),
}));

const NOW = new Date("2026-10-15T12:00:00Z");

function remoteIndex(index: VerificationIndex): IndexLoad {
  return {
    status: "ok",
    source: "remote",
    index,
    indexUrl: "https://verification.example/tdh/index.json",
    baseUrl: "https://verification.example/tdh/",
  };
}

function okDay(day = syntheticDay()): DayLoad {
  return {
    status: "ok",
    day,
    dayUrl: `https://verification.example/tdh/days/${day.cycleDay}.json`,
  };
}

function renderDashboard(
  indexLoad: IndexLoad,
  dayLoad: DayLoad | null,
  selectedCycleDay?: number,
  now: Date = NOW
) {
  const selected =
    indexLoad.status === "ok"
      ? (indexLoad.index.days.find(
          (day) => day.cycleDay === selectedCycleDay
        ) ?? null)
      : null;
  return render(
    <main>
      <h1>TDH verification</h1>
      <VerificationDashboard
        locale="en-US"
        indexLoad={indexLoad}
        dayLoad={dayLoad}
        selected={selected}
        now={now}
      />
    </main>
  );
}

/** Structural accessibility checks shared by every state. */
function expectAccessibleStructure(container: HTMLElement) {
  const ids = [...container.querySelectorAll("[id]")].map(
    (element) => element.id
  );
  expect(new Set(ids).size).toBe(ids.length);
  for (const table of container.querySelectorAll("table")) {
    expect(table.querySelector("caption")?.textContent?.trim()).toBeTruthy();
  }
  for (const button of screen.queryAllByRole("button")) {
    expect(button).toHaveAccessibleName();
  }
  for (const link of screen.queryAllByRole("link")) {
    expect(link).toHaveAccessibleName();
  }
  for (const image of container.querySelectorAll('[role="img"]')) {
    expect(image).toHaveAccessibleName();
  }
  const levels = [...container.querySelectorAll("h1, h2, h3")].map((heading) =>
    Number(heading.tagName[1])
  );
  levels.forEach((level, index) => {
    if (index > 0) {
      expect(level - (levels[index - 1] ?? level)).toBeLessThanOrEqual(1);
    }
  });
  expect(container.textContent).not.toMatch(/0x[0-9a-fA-F]{40}/);
}

describe("VerificationDashboard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the daily job's own files as the sample, labelled as run before D131 netting", async () => {
    const sample = await loadBundledSample();
    const { container } = renderDashboard(
      {
        status: "ok",
        source: "sample",
        index: sample.index,
        indexUrl: null,
        baseUrl: null,
      },
      { status: "ok", day: sample.days[20_741]!, dayUrl: null },
      20_741
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "Sample: the daily job’s own files for 14 and 15 October 2026."
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      /made before the Rust core netted within a transaction/
    );
    expect(screen.getAllByText("2 differ").length).toBe(2);
    expect(
      screen.getByText("10,280 of 10,282 equal · 99.98%")
    ).toBeInTheDocument();
    expect(screen.getByText("All equal")).toBeInTheDocument();
    expect(screen.getAllByText("−240").length).toBeGreaterThan(0);
    expect(screen.getByText("6529.io is 240 higher")).toBeInTheDocument();
    expect(screen.getAllByText("Off: run before D131").length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText("Not yet fully checked").length).toBeGreaterThan(
      0
    );
    expect(screen.getByText("Cutover in 8 days")).toBeInTheDocument();
    expect(screen.getAllByText("Explained").length).toBeGreaterThan(0);
    expect(screen.getByText(/2 holders differ/)).toBeInTheDocument();
    expect(screen.getByText("Total −63")).toBeInTheDocument();
    expect(screen.getByText("Total −177")).toBeInTheDocument();
    expect(
      screen.getByText(
        "holder-1/w1: the same fields and values as the identity."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sample data is bundled with this page; there is no file to download."
      )
    ).toBeInTheDocument();
    expectAccessibleStructure(container);
  });

  it("groups an identity with its wallets, filters by class and explains a cause", async () => {
    const user = userEvent.setup();
    const { container } = renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(),
      20_741
    );
    expect(
      screen.getByText(
        "2 holders differ: 1 identity and 2 wallet records. Rust − 6529.io over all identities: −120 TDH."
      )
    ).toBeInTheDocument();
    const filters = screen.getByRole("group", {
      name: "Filter differences by class",
    });
    expect(
      within(filters).getByRole("button", { name: /All/ })
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(within(filters).getByRole("button", { name: /Class D/ }));
    expect(
      screen.queryByRole("heading", { name: "holder-1" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "holder-2" })).toBeVisible();

    await user.click(within(filters).getByRole("button", { name: /Class A/ }));
    const card = screen.getByRole("heading", { name: "holder-1" })
      .parentElement!.parentElement!;
    expect(within(card).getByText("The Memes #1")).toBeInTheDocument();
    expect(within(card).getByText("Total −120")).toBeInTheDocument();
    await user.click(
      within(card).getByRole("button", { name: "Show all 3 fields" })
    );
    expect(within(card).getByText("memes_tdh")).toBeInTheDocument();
    expect(within(card).getByText("How this cause works")).toBeInTheDocument();
    expect(
      within(card).getByText(/a sale and a purchase of one card/)
    ).toBeInTheDocument();
    expect(
      within(card).getAllByRole("link", { name: "DEV-2" })[0]
    ).toHaveAttribute("href", "/network/tdh/specification#dev-2");
    expectAccessibleStructure(container);
  });

  it("shows exact per-holder values, the signed difference and the day's files", () => {
    renderDashboard(remoteIndex(syntheticIndex()), okDay(), 20_741);
    expect(screen.getAllByText("1,120").length).toBeGreaterThan(0);
    expect(screen.getAllByText("−120").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Investigating").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Download this day as JSON" })
    ).toHaveAttribute(
      "href",
      "https://verification.example/tdh/days/20741.json"
    );
    for (const link of screen.getAllByRole("link", {
      name: "Open block 26,194,188 on Etherscan",
    })) {
      expect(link).toHaveAttribute(
        "href",
        "https://etherscan.io/block/26194188"
      );
    }
    expect(
      screen.getByText(/validator compute --day 20741/)
    ).toBeInTheDocument();
  });

  it("says when the Python reference did not run", () => {
    const day = syntheticDay();
    renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay({
        ...day,
        implementations: { ...day.implementations, python: null },
        agreement: { ...day.agreement, rustVsPython: null },
      }),
      20_741
    );
    expect(
      screen.getByText("The Python reference did not run this day.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("Not run").length).toBeGreaterThan(0);
  });

  it("shows the empty state when a day has no differences", () => {
    renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(syntheticDay({ differences: [], verdict: "OK" })),
      20_741
    );
    expect(screen.getByText("No differences on this day.")).toBeInTheDocument();
    expect(screen.getAllByText("Equal").length).toBeGreaterThan(0);
  });

  it("maps the feed's alarm verdicts", () => {
    const { unmount } = renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(syntheticDay({ verdict: "RUST_PYTHON_MISMATCH" })),
      20_741
    );
    expect(screen.getAllByText("Mismatch").length).toBeGreaterThan(0);
    unmount();
    renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(syntheticDay({ verdict: "LIVE_UNAVAILABLE" })),
      20_741
    );
    expect(screen.getAllByText("6529.io file missing").length).toBeGreaterThan(
      0
    );
  });

  it("renders a listed day from the index when its own file is missing", () => {
    renderDashboard(
      remoteIndex(syntheticIndex()),
      { status: "not-found" },
      20_740
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This day’s details could not be loaded."
    );
    expect(screen.getAllByText("Explained").length).toBeGreaterThan(0);
  });

  it("shows an unknown verdict as See details", () => {
    renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(syntheticDay({ verdict: "UNDER_REVIEW" })),
      20_741
    );
    expect(screen.getAllByText("See details").length).toBeGreaterThan(0);
  });

  it("warns when reports are late and lists days with no report", () => {
    const index = syntheticIndex();
    renderDashboard(
      remoteIndex({
        ...index,
        days: [
          ...index.days,
          {
            cycleDay: 20_743,
            date: "2026-10-17",
            verdict: "OK",
            identitiesEqual: 10,
            identitiesTotal: 10,
            totalTdh: { rust: 10_000, python: 10_000, live: 10_000 },
          },
        ],
      }),
      okDay(),
      20_741,
      new Date("2026-10-20T12:00:00Z")
    );
    expect(
      screen.getByText(
        "No report for the last 3 days. The latest is cycle 20,743, October 17, 2026."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 day between reports has no report.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("No report").length).toBeGreaterThan(0);
    // Phones get one card per day, newest first, including the missing day.
    const list = screen.getByRole("list", { name: "Daily results" });
    const cards = within(list).getAllByRole("listitem");
    expect(cards.map((card) => card.textContent?.slice(0, 16))).toEqual([
      "October 17, 2026",
      "October 16, 2026",
      "October 15, 2026",
      "October 14, 2026",
    ]);
    expect(within(cards[1]!).getByText("No report")).toBeInTheDocument();
  });

  it("puts Rust against Python first after the cutover and labels the 6529.io check as publication", () => {
    renderDashboard(
      remoteIndex(
        syntheticIndex({
          cutover: {
            plannedDate: "2026-10-23",
            status: "done",
            cycleDay: 20_749,
          },
        })
      ),
      okDay(),
      20_741
    );
    const tiles = within(
      screen.getByRole("region", { name: "Agreement" }).querySelector("ul")!
    ).getAllByRole("listitem");
    expect(tiles[0]).toHaveTextContent("Identities equal, Rust and Python");
    expect(screen.getByText(/Publication check/)).toBeInTheDocument();
    expect(
      screen.getByText("Switched on October 23, 2026")
    ).toBeInTheDocument();
  });

  it("explains that reports have not started when production has no data source", () => {
    const { container } = renderDashboard({ status: "awaiting" }, null);
    expect(
      screen.getByText("Daily reports start on 16 October 2026.")
    ).toBeInTheDocument();
    expect(screen.getByText("Cutover in 8 days")).toBeInTheDocument();
    expectAccessibleStructure(container);
  });

  it("says reports are not yet connected once they should have started", () => {
    renderDashboard(
      { status: "awaiting" },
      null,
      undefined,
      new Date("2026-10-18T12:00:00Z")
    );
    expect(
      screen.getByText("Daily reports are not yet connected to this page.")
    ).toBeInTheDocument();
  });

  it("offers a retry when the data cannot be loaded", async () => {
    const user = userEvent.setup();
    renderDashboard({ status: "error", reason: "network" }, null);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The verification data could not be loaded."
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps the index summary when a day file fails", () => {
    renderDashboard(
      remoteIndex(syntheticIndex()),
      { status: "error", reason: "http" },
      20_741
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This day’s details could not be loaded."
    );
    expect(
      screen.getByText(/Identities equal, Rust and 6529.io: 9 of 10 equal/)
    ).toBeInTheDocument();
    expect(screen.getByText("Agreement over time")).toBeInTheDocument();
  });

  it("navigates between published days without changing the page while choosing", async () => {
    const user = userEvent.setup();
    renderDashboard(remoteIndex(syntheticIndex()), okDay(), 20_741);
    expect(screen.getByRole("link", { name: /Previous day/ })).toHaveAttribute(
      "href",
      "/network/tdh/verification/20740"
    );
    await user.selectOptions(screen.getByLabelText("Day"), "20740");
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Show day" }));
    expect(push).toHaveBeenCalledWith("/network/tdh/verification/20740");
  });
});
