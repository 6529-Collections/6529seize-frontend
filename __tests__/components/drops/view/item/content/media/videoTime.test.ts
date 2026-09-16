import { formatVideoTime } from "@/components/drops/view/item/content/media/videoTime";

it.each([
  [0, 10, "0:00"],
  [6, 10, "0:06"],
  [29 - Number.EPSILON * 16, 100, "0:29"],
  [59.9, 120, "0:59"],
  [60, 120, "1:00"],
  [6, 3601, "0:00:06"],
  [3601, 3601, "1:00:01"],
  [NaN, 0, "0:00"],
  [-1, 10, "0:00"],
])(
  "formats playback time %s with duration %s",
  (seconds, duration, expected) => {
    expect(formatVideoTime(seconds, duration, "en-US")).toBe(expected);
  }
);

it.each(["en-US", "en-GB", "fr-FR", "de-DE", "es-ES"] as const)(
  "keeps media clock notation in %s",
  (locale) => {
    expect(formatVideoTime(65, 130, locale)).toBe("1:05");
  }
);
