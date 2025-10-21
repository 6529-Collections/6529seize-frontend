import type { MintRescheduleOverride } from "./meme-calendar.overrides";

export const CUSTOM_RESCHEDULED_MINTS: readonly MintRescheduleOverride[] = [
  {
    mintNumber: 415,
    from: "2025-10-20",
    to: "2025-10-21",
    note: "Rescheduled from Monday 20th due to AWS outage",
  },
];
