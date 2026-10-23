import { launchCalendarPhases } from "@/components/drop-forge/launch/launch-calendar";
import { buildMemesPhases } from "@/hooks/useManifoldClaim";
import { Time } from "@/helpers/time";
import type { ApiDropForgePhase } from "@/generated/models/ApiDropForgePhase";
const day = new Date("2026-10-26T15:40:00Z");
const windows = buildMemesPhases(Time.millis(day.getTime()));
const saved: ApiDropForgePhase[] = windows.map((p) => ({
  name: p.name,
  start: p.start.toSeconds() - 3600,
  end: p.end.toSeconds() - 3600,
  price_wei: "65290000000000000",
  root: "0x" + "0".repeat(64),
}));
it("uses the frozen UTC windows even if today's calendar differs", () => {
  expect(
    launchCalendarPhases(day, saved).map((p) => [
      p.start.toSeconds(),
      p.end.toSeconds(),
    ])
  ).toEqual(saved.map((p) => [p.start, p.end]));
});
it("uses local calendar defaults only after confirming no saved launch exists", () => {
  expect(launchCalendarPhases(day, undefined)).toEqual([]);
  expect(
    launchCalendarPhases(day, null).map((p) => [
      p.id,
      p.start.toSeconds(),
      p.end.toSeconds(),
    ])
  ).toEqual(windows.map((p) => [p.id, p.start.toSeconds(), p.end.toSeconds()]));
});
it("does not substitute current dates for an incomplete saved plan", () => {
  expect(launchCalendarPhases(day, saved.slice(1))).toEqual([]);
  expect(
    launchCalendarPhases(
      day,
      saved.map((p) => ({ ...p, start: Number.NaN }))
    )
  ).toEqual([]);
});
