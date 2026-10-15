import UtcScheduleTime from "@/components/utils/time/UtcScheduleTime";
import { formatDate } from "@/i18n/format";
import { render } from "@testing-library/react";
import {
  mockDefaultTimeZone,
  renderServerThenHydrate,
  renderToStringInTimeZone,
} from "../../../utils/timeZoneHydration";

const CHECKPOINT = { hour: 16, minute: 0 } as const;
const MONDAY_WEDNESDAY_FRIDAY = [1, 3, 5] as const;
const SUMMER_MONDAY = Date.UTC(2026, 6, 13, 10);
const WINTER_MONDAY = Date.UTC(2026, 0, 12, 10);

function Checkpoint() {
  return (
    <p>
      <UtcScheduleTime
        time={CHECKPOINT}
        weekdays={MONDAY_WEDNESDAY_FRIDAY}
        locale="en-US"
      />
    </p>
  );
}

// What the component would be without the hydration guard: the viewer's zone
// is read during the first render, as a plain formatDate call would.
function UnguardedCheckpoint() {
  return (
    <p>
      {formatDate("en-US", Date.now(), {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZoneName: "short",
      })}
    </p>
  );
}

const VIEWERS = [
  {
    label: "Los Angeles in summer",
    zone: "America/Los_Angeles",
    now: SUMMER_MONDAY,
    local: "Mon, Wed, Fri 09:00 PDT",
  },
  {
    label: "Los Angeles in winter",
    zone: "America/Los_Angeles",
    now: WINTER_MONDAY,
    local: "Mon, Wed, Fri 08:00 PST",
  },
  {
    label: "Auckland in their winter",
    zone: "Pacific/Auckland",
    now: SUMMER_MONDAY,
    local: "Tue, Thu, Sat 04:00 GMT+12",
  },
  {
    label: "Auckland in their summer",
    zone: "Pacific/Auckland",
    now: WINTER_MONDAY,
    local: "Tue, Thu, Sat 05:00 GMT+13",
  },
] as const;

describe("UtcScheduleTime", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("detects the mismatch it prevents when the viewer's zone is read in the render", async () => {
    jest.spyOn(Date, "now").mockReturnValue(SUMMER_MONDAY);
    const result = await renderServerThenHydrate(<UnguardedCheckpoint />, {
      serverTimeZone: "UTC",
      clientTimeZone: "America/Los_Angeles",
    });
    try {
      expect(result.serverHtml).toContain("10:00 UTC");
      expect(result.recoverableErrors).not.toHaveLength(0);
    } finally {
      await result.cleanup();
    }
  });

  it.each(VIEWERS)(
    "hydrates the UTC time, then shows $label's equivalent",
    async ({ zone, now, local }) => {
      jest.spyOn(Date, "now").mockReturnValue(now);
      const result = await renderServerThenHydrate(<Checkpoint />, {
        serverTimeZone: "UTC",
        clientTimeZone: zone,
      });
      try {
        expect(result.serverHtml).toContain("16:00 UTC");
        expect(result.serverHtml).not.toContain("your time");
        expect(result.recoverableErrors).toEqual([]);
        expect(result.hydrationConsoleErrors).toEqual([]);
        expect(result.container).toHaveTextContent(
          `16:00 UTC (your time: ${local})`
        );
      } finally {
        await result.cleanup();
      }
    }
  );

  it("renders the same server HTML whatever zone or date the server has", () => {
    const html = (zone: string, now: number) => {
      jest.spyOn(Date, "now").mockReturnValue(now);
      const rendered = renderToStringInTimeZone(<Checkpoint />, zone);
      jest.restoreAllMocks();
      return rendered;
    };

    const baseline = html("UTC", SUMMER_MONDAY);
    expect(baseline).toContain("16:00 UTC");
    expect(html("America/Los_Angeles", WINTER_MONDAY)).toBe(baseline);
    expect(html("Pacific/Auckland", WINTER_MONDAY)).toBe(baseline);
  });

  it("adds nothing for a viewer whose zone is UTC", async () => {
    jest.spyOn(Date, "now").mockReturnValue(SUMMER_MONDAY);
    const result = await renderServerThenHydrate(<Checkpoint />, {
      serverTimeZone: "UTC",
      clientTimeZone: "UTC",
    });
    try {
      expect(result.recoverableErrors).toEqual([]);
      expect(result.container).toHaveTextContent(/^16:00 UTC$/);
    } finally {
      await result.cleanup();
    }
  });

  it("shows the local equivalent at once when mounted after hydration", () => {
    jest.spyOn(Date, "now").mockReturnValue(WINTER_MONDAY);
    const restoreZone = mockDefaultTimeZone("Pacific/Auckland");
    try {
      const { container } = render(<Checkpoint />);

      expect(container).toHaveTextContent(
        "16:00 UTC (your time: Tue, Thu, Sat 05:00 GMT+13)"
      );
    } finally {
      restoreZone();
    }
  });

  it("shows the time of the wave rather than a fixed hour", () => {
    jest.spyOn(Date, "now").mockReturnValue(SUMMER_MONDAY);
    const restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    try {
      const { container } = render(
        <UtcScheduleTime
          time={{ hour: 9, minute: 30 }}
          weekdays={[1]}
          locale="en-US"
        />
      );

      expect(container).toHaveTextContent(
        "09:30 UTC (your time: Mon 02:30 PDT)"
      );
    } finally {
      restoreZone();
    }
  });
});
