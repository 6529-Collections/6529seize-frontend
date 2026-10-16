import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerificationDashboard from "@/app/network/tdh/verification/components/VerificationDashboard";
import type {
  DayLoad,
  IndexLoad,
} from "@/lib/tdh/verification/loadVerification.server";
import {
  parseVerificationDay,
  parseVerificationIndex,
  type VerificationIndex,
} from "@/lib/tdh/verification/schema";
import {
  syntheticDay,
  syntheticEqualDay,
  syntheticIndex,
} from "../../../../lib/tdh/verification/fixtures";
import {
  PUBLIC_FEED_DAYS,
  PUBLIC_FEED_INDEX,
} from "../../../../lib/tdh/verification/publicFeedFixture";

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
  now: Date = NOW,
  permalink = false
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
        permalink={permalink}
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
    const caption = table.querySelector("caption");
    // A caption taken out of flow (sr-only) breaks the table's columns, so a
    // table is named by a visible caption or by aria-label.
    expect(caption?.className ?? "").not.toMatch(/sr-only/);
    expect(
      caption?.textContent?.trim() || table.getAttribute("aria-label")
    ).toBeTruthy();
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

  it("shows the public feed's published days, with the result first", () => {
    const index = parseVerificationIndex(PUBLIC_FEED_INDEX);
    const day = parseVerificationDay(PUBLIC_FEED_DAYS[20_741]);
    if (!index.success || !day.success) {
      throw new Error("the public feed fixture no longer parses");
    }
    // The dashboard itself, on its latest day (no day selected).
    const { container } = renderDashboard(
      remoteIndex(index.data),
      okDay(day.data)
    );
    expect(screen.queryByText(/sample/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Cycle of October 15, 2026 (holdings at the last Ethereum block before 00:00 UTC): the Rust core, the Python reference and 6529.io agreed on all 10,282 identity records, each collector’s and the two burn addresses’, and all 11,133 wallet records, to the last unit of TDH."
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText("All equal").length).toBe(2);
    expect(screen.getAllByText("2,073,214,934").length).toBeGreaterThan(1);
    expect(screen.getByText("The same in all three")).toBeInTheDocument();
    expect(screen.getAllByText("Wallets: 11,133 of 11,133 equal").length).toBe(
      2
    );
    expect(screen.getByText("In 8 days")).toBeInTheDocument();
    expect(screen.getAllByText("Not yet fully checked").length).toBeGreaterThan(
      0
    );
    expect(
      screen.getByText(
        /No differences: every identity and wallet record is equal/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Individual records are never published/)
    ).toBeInTheDocument();
    expect(screen.getAllByText("validator@e127676").length).toBeGreaterThan(1);
    expect(screen.getAllByText("6529chain@0621ed4").length).toBeGreaterThan(1);
    expect(
      screen.getByRole("link", { name: "Download this day as JSON" })
    ).toHaveAttribute(
      "href",
      "https://verification.example/tdh/days/20741.json"
    );
    expect(container.textContent).not.toMatch(/holder-\d/);
    expectAccessibleStructure(container);
  });

  it("never says there are no differences on a day whose counts say otherwise", () => {
    const { container } = renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(),
      20_741
    );
    expect(screen.getAllByText("Investigating").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Cycle of October 15, 2026 (holdings at the last Ethereum block before 00:00 UTC): 9 of 10 identity records were equal between the Rust core and 6529.io. Not every difference is explained yet, so an alarm was raised."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/No differences/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Records that differ: identities 1, wallets 1.")
    ).toBeInTheDocument();
    expect(screen.getByText("Not yet explained")).toBeInTheDocument();
    expect(
      screen.getByText(/^1 differs · 90(.00)?% equal$/)
    ).toBeInTheDocument();
    expectAccessibleStructure(container);
  });

  it("falls back to the agreement counts when a day carries no summary", () => {
    renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(syntheticDay({ verdict: "OK", differenceSummary: null })),
      20_741
    );
    expect(screen.getAllByText("Explained").length).toBeGreaterThan(0);
    expect(screen.queryByText(/No differences/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Records that differ: identities 1, wallets 1.")
    ).toBeInTheDocument();
    expect(screen.queryByText("By cause")).not.toBeInTheDocument();
  });

  it("links the day's files and the explorers, and shows the commands", () => {
    renderDashboard(remoteIndex(syntheticIndex()), okDay(), 20_741);
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
      screen.getByText(
        (_, element) =>
          element?.tagName === "CODE" &&
          /validator compute --day 20741/.test(element.textContent ?? "")
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "CODE" &&
          /three_way\.py --day 20741/.test(element.textContent ?? "")
      )
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
    expect(screen.getAllByText("Equal").length).toBeGreaterThan(0);
  });

  it("shows an unknown verdict as See details", () => {
    renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(syntheticDay({ verdict: "UNDER_REVIEW" })),
      20_741
    );
    expect(screen.getAllByText("See details").length).toBeGreaterThan(0);
  });

  it("warns when reports are late and shows days with no report", () => {
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
      // The dashboard itself: a day's own page is a record and shows no
      // live freshness line.
      undefined,
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
    expect(
      screen.getByRole("img", { name: "October 16, 2026: no report" })
    ).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Daily results" });
    const cards = within(list).getAllByRole("listitem");
    expect(cards.map((card) => card.textContent?.slice(0, 16))).toEqual([
      "October 17, 2026",
      "October 16, 2026",
      "October 15, 2026",
      "October 14, 2026",
    ]);
  });

  it("leads up to the planned cutover in the calendar, and stops counting on older days", () => {
    const { unmount } = renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(),
      20_741
    );
    expect(
      screen.getByRole("img", {
        name: "October 23, 2026: planned cutover (D132)",
      })
    ).toBeInTheDocument();
    unmount();
    renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(syntheticEqualDay({ cycleDay: 20_740, date: "2026-10-14" })),
      20_740,
      NOW,
      true
    );
    // A day's own page counts down from that day, not from today.
    expect(screen.queryByText("In 8 days")).not.toBeInTheDocument();
    expect(screen.getByText("9 days to go")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Not the latest day: go to the latest" })
    ).toHaveAttribute("href", "/network/tdh/verification");
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
      screen
        .getByRole("region", { name: "The day at a glance" })
        .querySelector("ul")!
    ).getAllByRole("listitem");
    expect(tiles[0]).toHaveTextContent("Rust core and Python");
    expect(screen.getByText(/Publication check/)).toBeInTheDocument();
    expect(
      screen.getByText("Switched on October 23, 2026")
    ).toBeInTheDocument();
  });

  it("says plainly when the feed has published no report yet", () => {
    const { container } = renderDashboard({ status: "awaiting" }, null);
    expect(
      screen.getByText("No daily report is published yet.")
    ).toBeInTheDocument();
    expect(screen.getByText("In 8 days")).toBeInTheDocument();
    expectAccessibleStructure(container);
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
    expect(screen.getByText(/Identity records: 9 of 10/)).toBeInTheDocument();
    expect(screen.getByText("Day by day")).toBeInTheDocument();
  });

  it("links the previous and next day, and each day of the calendar", () => {
    renderDashboard(remoteIndex(syntheticIndex()), okDay(), 20_741);
    expect(screen.getByRole("link", { name: "Previous day" })).toHaveAttribute(
      "href",
      "/network/tdh/verification/20740"
    );
    expect(
      screen.getByRole("link", { name: /^October 14, 2026, cycle 20,740/ })
    ).toHaveAttribute("href", "/network/tdh/verification/20740");
    expect(
      screen.getByRole("link", { name: /^October 15, 2026, cycle 20,741/ })
    ).toHaveAttribute("aria-current", "date");
  });
});
