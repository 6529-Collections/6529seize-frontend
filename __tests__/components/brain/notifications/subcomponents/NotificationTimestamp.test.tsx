import NotificationTimestamp from "@/components/brain/notifications/subcomponents/NotificationTimestamp";
import { renderServerThenHydrate } from "@/__tests__/utils/timeZoneHydration";

const CREATED_AT = Date.parse("2026-10-12T11:27:11.000Z");
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

describe("NotificationTimestamp", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    {
      label: "a recent notification after the server clock moves on",
      serverNow: CREATED_AT + 30_000,
      clientNow: CREATED_AT + 2 * MINUTE_MS + 30_000,
      expected: "2m",
    },
    {
      label: "an older notification on a different Auckland calendar day",
      serverNow: CREATED_AT + 3 * DAY_MS,
      clientNow: CREATED_AT + 3 * DAY_MS + MINUTE_MS,
      expected: "Oct 13",
    },
  ])(
    "hydrates $label without a mismatch",
    async ({ serverNow, clientNow, expected }) => {
      const now = jest.spyOn(Date, "now").mockReturnValue(serverNow);
      const result = await renderServerThenHydrate(
        <NotificationTimestamp createdAt={CREATED_AT} />,
        {
          serverTimeZone: "UTC",
          clientTimeZone: "Pacific/Auckland",
          beforeHydrate: () => now.mockReturnValue(clientNow),
        }
      );
      try {
        expect(result.recoverableErrors).toEqual([]);
        expect(result.hydrationConsoleErrors).toEqual([]);
        const time = result.container.querySelector("time");
        expect(time).toHaveAttribute("datetime", "2026-10-12T11:27:11.000Z");
        expect(time).toHaveTextContent(new RegExp(`^${expected}$`));
      } finally {
        await result.cleanup();
      }
    }
  );
});
