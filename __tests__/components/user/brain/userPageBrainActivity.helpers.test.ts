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
  it("builds a heatmap view model from the activity response", () => {
    const activity = buildUserPageBrainActivityViewModel(
      buildResponse({
        lastDate: new Date(Date.UTC(2026, 2, 16)),
        countsByIsoDate: {
          "2026-01-01": 1,
          "2026-01-15": 3,
          "2026-02-01": 8,
          "2026-03-03": 20,
          "2026-03-04": 50,
        },
      })
    );

    expect(activity).not.toBeNull();
    expect(activity?.periodLabel).toBe("the last 12 months");
    expect(activity?.totalDrops).toBe(82);
    expect(activity?.weekCount).toBeGreaterThan(0);
    expect(activity?.monthLabels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Jan" }),
        expect.objectContaining({ label: "Feb" }),
        expect.objectContaining({ label: "Mar" }),
      ])
    );
    expect(activity?.cells.length).toBe((activity?.weekCount ?? 0) * 7);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-01-01")
    ).toMatchObject({
      count: 1,
      state: "active",
      intensity: 1,
      ariaLabel: "Jan 1, 2026: 1 public post",
    });
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-01-15")
    ).toMatchObject({
      count: 3,
      intensity: 1,
    });
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-02-01")
    ).toMatchObject({
      count: 8,
      intensity: 2,
    });
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-03")
    ).toMatchObject({
      count: 20,
      intensity: 3,
    });
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-04")
    ).toMatchObject({
      count: 50,
      intensity: 4,
    });
  });

  it("uses per-profile quantile buckets for active-day intensity", () => {
    const activity = buildUserPageBrainActivityViewModel(
      buildResponse({
        lastDate: new Date(Date.UTC(2026, 2, 16)),
        countsByIsoDate: {
          "2026-03-03": 1,
          "2026-03-04": 2,
          "2026-03-05": 3,
          "2026-03-06": 7,
          "2026-03-07": 8,
          "2026-03-08": 19,
          "2026-03-09": 20,
          "2026-03-10": 49,
        },
      })
    );

    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-03")?.intensity
    ).toBe(1);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-04")?.intensity
    ).toBe(1);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-05")?.intensity
    ).toBe(2);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-06")?.intensity
    ).toBe(2);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-07")?.intensity
    ).toBe(3);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-08")?.intensity
    ).toBe(3);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-09")?.intensity
    ).toBe(4);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-10")?.intensity
    ).toBe(4);
  });

  it("scales intensity relative to each profile rather than global thresholds", () => {
    const activity = buildUserPageBrainActivityViewModel(
      buildResponse({
        lastDate: new Date(Date.UTC(2026, 2, 16)),
        countsByIsoDate: {
          "2026-03-10": 1,
          "2026-03-11": 20,
          "2026-03-12": 155,
          "2026-03-13": 500,
        },
      })
    );

    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-10")?.intensity
    ).toBe(1);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-11")?.intensity
    ).toBe(2);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-12")?.intensity
    ).toBe(3);
    expect(
      activity?.cells.find((cell) => cell.isoDate === "2026-03-13")?.intensity
    ).toBe(4);
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
    expect(activity?.weekCount).toBeGreaterThan(0);
    expect(activity?.cells.length).toBe(
      activity?.weekCount ? activity.weekCount * 7 : 0
    );
    expect(
      activity?.cells.every((cell) =>
        cell.state === "padding" ? true : cell.state === "empty"
      )
    ).toBe(true);
  });
});
