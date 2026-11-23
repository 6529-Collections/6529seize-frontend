// The setup guide's pages under /validator/guide, in reading order. The
// first entry is the start page.

import type {
  ValidatorGuidePageText,
  ValidatorGuidePath,
} from "./guidePageTypes";
import { GUIDE_PAGES_PART_1 } from "./guidePagesPart1";
import { GUIDE_PAGES_PART_2 } from "./guidePagesPart2";
import { VALIDATOR_FEEDBACK_WAVE_HREF } from "./pageText";

export const VALIDATOR_GUIDE_PAGES: readonly ValidatorGuidePageText[] = [
  ...GUIDE_PAGES_PART_1,
  ...GUIDE_PAGES_PART_2,
].map(({ lines, ...page }) => ({
  ...page,
  markdown: lines
    .join("\n")
    .replaceAll("](WAVE)", `](${VALIDATOR_FEEDBACK_WAVE_HREF})`),
}));

export const VALIDATOR_GUIDE_PATHS: readonly ValidatorGuidePath[] = [
  {
    title: "A computer you already have",
    href: "/validator/guide/your-computer",
    summary: "Your PC or Mac, left on",
    facts: [
      { label: "To buy", value: "Nothing" },
      { label: "A month", value: "The power to leave it on" },
      { label: "Setup", value: "About 15 minutes (estimate)" },
      { label: "You do", value: "Install an app" },
    ],
  },
  {
    title: "An always-on box at home",
    href: "/validator/guide/home-box",
    summary: "A mini PC, Mac mini or Raspberry Pi that runs only the validator",
    facts: [
      {
        label: "To buy",
        value: "A small computer, if you don't have a spare one",
      },
      { label: "A month", value: "About $1-3 of power (estimate)" },
      { label: "Setup", value: "About an hour (estimate), plus delivery" },
      {
        label: "You do",
        value: "Install an app, or type commands on a Raspberry Pi",
      },
    ],
  },
];
