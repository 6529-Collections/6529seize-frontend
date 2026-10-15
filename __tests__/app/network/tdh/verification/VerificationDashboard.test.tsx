import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerificationDashboard from "@/app/network/tdh/verification/components/VerificationDashboard";
import type {
  DayLoad,
  IndexLoad,
} from "@/lib/tdh/verification/loadVerification.server";
import {
  SAMPLE_VERIFICATION_DAYS,
  SAMPLE_VERIFICATION_INDEX,
} from "@/lib/tdh/verification/sampleData";
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
  selectedCycleDay?: number
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
        now={NOW}
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

  it("shows the bundled sample with its banner, real comparison figures and honest labels", () => {
    const { container } = renderDashboard(
      {
        status: "ok",
        source: "sample",
        index: SAMPLE_VERIFICATION_INDEX,
        indexUrl: null,
        baseUrl: null,
      },
      { status: "ok", day: SAMPLE_VERIFICATION_DAYS[20_741]!, dayUrl: null },
      20_741
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "Sample data, not a measurement."
    );
    expect(
      screen.getByText(/Python figures are copied from Rust/)
    ).toBeInTheDocument();
    expect(screen.getAllByText("10,280 of 10,282").length).toBeGreaterThan(0);
    expect(screen.getAllByText("11,131 of 11,133").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-240").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not yet fully checked").length).toBeGreaterThan(
      0
    );
    expect(screen.getByText("Cutover in 8 days")).toBeInTheDocument();
    expect(screen.getAllByText("Explained").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Sample data has no downloadable files.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not carry these per-holder values/)
    ).toBeInTheDocument();
    expectAccessibleStructure(container);
  });

  it("lists differences with class and cause, filters by class and expands a cause", async () => {
    const user = userEvent.setup();
    const { container } = renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(),
      20_741
    );
    const filters = screen.getByRole("group", {
      name: "Filter differences by class",
    });
    expect(
      within(filters).getByRole("button", { name: /All/ })
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(within(filters).getByRole("button", { name: /Class B/ }));
    expect(
      screen.getByText("No differences in this class on this day.")
    ).toBeInTheDocument();

    await user.click(within(filters).getByRole("button", { name: /Class A/ }));
    const toggle = screen.getByRole("button", {
      name: "Details for holder-1, Identity",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/never left/)).toBeVisible();
    expect(
      screen.getByRole("img", { name: /One transaction, two movements/ })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "DEV-2" })[0]).toHaveAttribute(
      "href",
      "/network/tdh/specification#dev-2"
    );
    expectAccessibleStructure(container);
  });

  it("shows exact per-holder values and the signed difference when the day carries them", () => {
    renderDashboard(remoteIndex(syntheticIndex()), okDay(), 20_741);
    expect(screen.getAllByText("1,120").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-120").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Investigating").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Download this day as JSON" })
    ).toHaveAttribute(
      "href",
      "https://verification.example/tdh/days/20741.json"
    );
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
      screen.getByText("Python reference not run this day.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("Not run").length).toBeGreaterThan(0);
  });

  it("shows the empty state when a day has no differences", () => {
    renderDashboard(
      remoteIndex(syntheticIndex()),
      okDay(syntheticDay({ differences: [], verdict: "equal" })),
      20_741
    );
    expect(screen.getByText("No differences on this day.")).toBeInTheDocument();
    expect(screen.getAllByText("Equal").length).toBeGreaterThan(0);
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
      okDay(syntheticDay({ verdict: "under-review" })),
      20_741
    );
    expect(screen.getAllByText("See details").length).toBeGreaterThan(0);
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
      screen.getByText(/Identities equal, Rust and 6529.io: 9 of 10/)
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
