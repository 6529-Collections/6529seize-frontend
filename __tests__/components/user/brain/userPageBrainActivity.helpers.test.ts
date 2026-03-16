import {
  buildUserPageBrainActivityViewModel,
  type UserPageBrainActivityResponse,
} from "@/components/user/brain/userPageBrainActivity.helpers";
import { Time } from "@/helpers/time";

const DAY_MS = Time.days(1).toMillis();

function formatBackendDate(date: Date): string {
  return [
    date.getUTCDate().toString().padStart(2, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCFullYear().toString(),
  ].join(".");
}

function buildResponse({
  lastDate,
  countsByIsoDate,
}: {
  lastDate: Date;
  countsByIsoDate?: Record<string, number> | undefined;
}): UserPageBrainActivityResponse {
  const startMs = lastDate.getTime() - 364 * DAY_MS;

  return {
    last_date: formatBackendDate(lastDate),
    date_samples: Array.from({ length: 365 }, (_, index) => {
      const isoDate = new Date(startMs + index * DAY_MS)
        .toISOString()
        .slice(0, 10);
      return countsByIsoDate?.[isoDate] ?? 0;
    }),
  };
}

describe("buildUserPageBrainActivityViewModel", () => {
  it("builds a rolling-year heatmap from the activity response", () => {
    const activity = buildUserPageBrainActivityViewModel(
      buildResponse({
        lastDate: new Date(Date.UTC(2026, 2, 16)),
        countsByIsoDate: {
          "2025-03-17": 5,
          "2025-04-01": 6,
          "2026-03-01": 1,
          "2026-03-02": 2,
          "2026-03-03": 3,
          "2026-03-04": 4,
          "2026-03-16": 2,
        },
      })
    );

    expect(activity).not.toBeNull();
    expect(activity?.totalDrops).toBe(23);
    expect(activity?.maxCount).toBe(6);
    expect(activity?.weekCount).toBe(53);
    expect(activity?.monthLabels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Apr" }),
        expect.objectContaining({ label: "Mar" }),
      ])
    );
    expect(activity?.cells).toHaveLength(53 * 7);
    expect(activity?.cells[0]).toMatchObject({
      state: "padding",
      isoDate: null,
    });
    expect(activity?.cells[1]).toMatchObject({
      isoDate: "2025-03-17",
      count: 5,
      state: "active",
      intensity: 4,
    });
    expect(activity?.cells.find((cell) => cell.isoDate === "2025-04-01")).toMatchObject(
      {
        count: 6,
        state: "active",
        intensity: 4,
      }
    );
    expect(activity?.cells.find((cell) => cell.isoDate === "2026-03-01")).toMatchObject(
      {
        count: 1,
        state: "active",
        intensity: 1,
      }
    );
    expect(activity?.cells.find((cell) => cell.isoDate === "2026-03-02")).toMatchObject(
      {
        count: 2,
        intensity: 2,
      }
    );
    expect(activity?.cells.find((cell) => cell.isoDate === "2026-03-03")).toMatchObject(
      {
        count: 3,
        intensity: 2,
      }
    );
    expect(activity?.cells.find((cell) => cell.isoDate === "2026-03-04")).toMatchObject(
      {
        count: 4,
        intensity: 3,
      }
    );
    expect(activity?.cells.find((cell) => cell.isoDate === "2026-03-16")).toMatchObject(
      {
        count: 2,
        state: "active",
      }
    );
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-17")
    ).toBeUndefined();
    expect(activity?.cells.at(-1)).toMatchObject({
      state: "padding",
      isoDate: null,
    });
    expect(activity?.cells.find((cell) => cell.isoDate === "2026-03-01")).toMatchObject({
      isoDate: "2026-03-01",
      count: 1,
      state: "active",
      intensity: 1,
    });
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-01")?.title
    ).toBe("Mar 1, 2026: 1 drop");
  });

  it("returns null for an invalid anchor date", () => {
    expect(
      buildUserPageBrainActivityViewModel({
        last_date: "2026-03-16",
        date_samples: [1, 2, 3],
      })
    ).toBeNull();
  });

  it("keeps empty years renderable", () => {
    const activity = buildUserPageBrainActivityViewModel(
      buildResponse({
        lastDate: new Date(Date.UTC(2026, 1, 28)),
      })
    );

    expect(activity?.totalDrops).toBe(0);
    expect(activity?.maxCount).toBe(0);
    expect(activity?.weekCount).toBeGreaterThan(0);
    expect(activity?.cells.length).toBe(activity?.weekCount ? activity.weekCount * 7 : 0);
    expect(
      activity?.cells.every((cell) =>
        cell.state === "padding" ? true : cell.state === "empty"
      )
    ).toBe(true);
  });
});
