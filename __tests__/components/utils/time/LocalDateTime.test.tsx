import LocalDateTime from "@/components/utils/time/LocalDateTime";
import { formatDate } from "@/i18n/format";
import { render, screen } from "@testing-library/react";
import {
  mockDefaultTimeZone,
  renderServerThenHydrate,
} from "@/__tests__/utils/timeZoneHydration";

// 11:27 UTC on Oct 12 is already 00:27 on Oct 13 in Auckland (UTC+13).
const MINTED_AT = "2026-10-12T11:27:11.000Z";
const SERVER_AND_AUCKLAND = {
  serverTimeZone: "UTC",
  clientTimeZone: "Pacific/Auckland",
} as const;

function ZoneDependentDate({ value }: { readonly value: string }) {
  return <span>{formatDate("en-US", value)}</span>;
}

describe("LocalDateTime", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("detects the mismatch it prevents when a date is formatted in the render", async () => {
    const result = await renderServerThenHydrate(
      <ZoneDependentDate value={MINTED_AT} />,
      SERVER_AND_AUCKLAND
    );
    try {
      expect(result.serverHtml).toContain("Oct 12, 2026");
      expect(result.recoverableErrors).not.toHaveLength(0);
    } finally {
      await result.cleanup();
    }
  });

  it("hydrates a UTC-labelled server date, then shows the viewer's local date", async () => {
    const result = await renderServerThenHydrate(
      <LocalDateTime value={MINTED_AT} locale="en-US" />,
      SERVER_AND_AUCKLAND
    );
    try {
      expect(result.serverHtml.toLowerCase()).toContain(
        `datetime="${MINTED_AT.toLowerCase()}"`
      );
      expect(result.serverHtml).toContain("Oct 12, 2026, UTC");
      expect(result.recoverableErrors).toEqual([]);
      expect(result.hydrationConsoleErrors).toEqual([]);
      const time = result.container.querySelector("time");
      expect(time).toHaveAttribute("datetime", MINTED_AT);
      expect(time).toHaveTextContent(/^Oct 13, 2026$/);
    } finally {
      await result.cleanup();
    }
  });

  it("labels date-times with the UTC zone on the server and the local zone after hydration", async () => {
    const result = await renderServerThenHydrate(
      <LocalDateTime value={Date.parse(MINTED_AT)} format="dateTime" />,
      SERVER_AND_AUCKLAND
    );
    try {
      expect(result.serverHtml).toContain("Oct 12, 2026, 11:27 AM UTC");
      expect(result.recoverableErrors).toEqual([]);
      expect(result.hydrationConsoleErrors).toEqual([]);
      expect(result.container).toHaveTextContent(
        "Oct 13, 2026, 12:27 AM GMT+13"
      );
    } finally {
      await result.cleanup();
    }
  });

  it("leaves relative time to the client so a later hydration clock cannot mismatch", async () => {
    const createdAt = Date.parse(MINTED_AT);
    const now = jest.spyOn(Date, "now").mockReturnValue(createdAt + 30_000);
    const result = await renderServerThenHydrate(
      <LocalDateTime value={createdAt} format="relative" />,
      {
        ...SERVER_AND_AUCKLAND,
        beforeHydrate: () => now.mockReturnValue(createdAt + 150_000),
      }
    );
    try {
      expect(result.serverHtml).not.toContain("Just now");
      expect(result.serverHtml).toContain("Oct 12, 2026, 11:27 AM UTC");
      expect(result.recoverableErrors).toEqual([]);
      expect(result.hydrationConsoleErrors).toEqual([]);
      const time = result.container.querySelector("time");
      expect(time).toHaveAttribute("datetime", MINTED_AT);
      expect(time).toHaveTextContent(/^2m$/);
    } finally {
      await result.cleanup();
    }
  });

  it("renders the local text immediately when it mounts after hydration", () => {
    const restoreTimeZone = mockDefaultTimeZone("Pacific/Auckland");
    try {
      render(<LocalDateTime value={MINTED_AT} locale="en-US" />);
      expect(screen.getByText("Oct 13, 2026")).toHaveAttribute(
        "datetime",
        MINTED_AT
      );
      expect(screen.queryByText(/UTC/)).not.toBeInTheDocument();
    } finally {
      restoreTimeZone();
    }
  });

  it("formats with the browser locale unless a locale is pinned", () => {
    jest.spyOn(navigator, "languages", "get").mockReturnValue(["de-DE"]);
    const restoreTimeZone = mockDefaultTimeZone("Pacific/Auckland");
    try {
      render(
        <>
          <LocalDateTime value={MINTED_AT} />
          <LocalDateTime value={MINTED_AT} locale="en-US" />
        </>
      );
      expect(screen.getByText("13. Okt. 2026")).toBeInTheDocument();
      expect(screen.getByText("Oct 13, 2026")).toBeInTheDocument();
    } finally {
      restoreTimeZone();
    }
  });

  it("renders nothing for an invalid instant", () => {
    const { container } = render(<LocalDateTime value="not a date" />);
    expect(container).toBeEmptyDOMElement();
  });
});
