import { render, screen } from "@testing-library/react";
import AboutApply from "@/components/about/AboutApply";
import {
  mockDefaultTimeZone,
  renderServerThenHydrate,
} from "../../utils/timeZoneHydration";

// Mondays at 10:00 UTC, before that day's 16:00 UTC checkpoint.
const SUMMER_MONDAY = Date.UTC(2026, 6, 13, 10);
const WINTER_MONDAY = Date.UTC(2026, 0, 12, 10);

describe("AboutApply", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("displays eligibility requirements", () => {
    render(<AboutApply />);
    expect(screen.getByText(/Previous Meme Artist/i)).toBeInTheDocument();
    expect(screen.getByText(/Community Nomination/i)).toBeInTheDocument();
  });

  it("links to the Seeking Nomination wave", () => {
    render(<AboutApply />);
    const link = screen.getByRole("link", {
      name: /The Memes - Seeking Nomination/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://6529.io/waves/0ecb95d0-d8f2-48e8-8137-bfa71ee8593c"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows checkpoint schedule days", () => {
    render(<AboutApply />);
    ["Monday", "Wednesday", "Friday"].forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it("states the checkpoint time as 16:00 UTC, the time it is all year", () => {
    jest.spyOn(Date, "now").mockReturnValue(SUMMER_MONDAY);
    const { container } = render(<AboutApply />);

    expect(screen.getAllByText(/16:00 UTC/)).toHaveLength(3);
    expect(container).not.toHaveTextContent("17:00");
    expect(container).not.toHaveTextContent("GMT");
  });

  it.each([
    {
      label: "Los Angeles in summer",
      zone: "America/Los_Angeles",
      now: SUMMER_MONDAY,
      rows: ["Mon 09:00 PDT", "Wed 09:00 PDT", "Fri 09:00 PDT"],
    },
    {
      label: "Los Angeles in winter",
      zone: "America/Los_Angeles",
      now: WINTER_MONDAY,
      rows: ["Mon 08:00 PST", "Wed 08:00 PST", "Fri 08:00 PST"],
    },
    {
      label: "Auckland in their summer",
      zone: "Pacific/Auckland",
      now: WINTER_MONDAY,
      rows: ["Tue 05:00 GMT+13", "Thu 05:00 GMT+13", "Sat 05:00 GMT+13"],
    },
    {
      label: "Auckland in their winter",
      zone: "Pacific/Auckland",
      now: SUMMER_MONDAY,
      rows: ["Tue 04:00 GMT+12", "Thu 04:00 GMT+12", "Sat 04:00 GMT+12"],
    },
  ])(
    "hydrates the UTC checkpoints, then adds the equivalent for $label",
    async ({ zone, now, rows }) => {
      jest.spyOn(Date, "now").mockReturnValue(now);
      const result = await renderServerThenHydrate(<AboutApply />, {
        serverTimeZone: "UTC",
        clientTimeZone: zone,
      });
      try {
        expect(result.serverHtml.match(/16:00 UTC/g)).toHaveLength(3);
        expect(result.serverHtml).not.toContain("your time");
        expect(result.recoverableErrors).toEqual([]);
        expect(result.hydrationConsoleErrors).toEqual([]);
        for (const row of rows) {
          expect(result.container).toHaveTextContent(
            `16:00 UTC (your time: ${row})`
          );
        }
      } finally {
        await result.cleanup();
      }
    }
  );

  it("shows the equivalent in the viewer's zone when mounted after hydration", () => {
    jest.spyOn(Date, "now").mockReturnValue(WINTER_MONDAY);
    const restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    try {
      const { container } = render(<AboutApply />);

      expect(container).toHaveTextContent(
        "16:00 UTC (your time: Mon 08:00 PST)"
      );
    } finally {
      restoreZone();
    }
  });

  it("includes artist feedback usernames", () => {
    render(<AboutApply />);
    ["@6529er", "@teexels", "@darrensrs"].forEach((handle) => {
      expect(screen.getByText(handle)).toBeInTheDocument();
    });
  });

  it("contains contact email link", () => {
    render(<AboutApply />);
    const link = screen.getByRole("link", { name: /collections@6529.io/i });
    expect(link).toHaveAttribute("href", "mailto:collections@6529.io");
  });
});
