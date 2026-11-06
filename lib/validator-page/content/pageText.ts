import { getWaveRoute } from "@/helpers/navigation.helpers";

/** The public wave where testers post their results. */
const VALIDATOR_FEEDBACK_WAVE_ID = "3c1072f4-4f74-4657-8ad2-c7acf3c9c36d";

export const VALIDATOR_FEEDBACK_WAVE = "Ministry of Validation";

export const VALIDATOR_FEEDBACK_WAVE_HREF = getWaveRoute({
  waveId: VALIDATOR_FEEDBACK_WAVE_ID,
  isDirectMessage: false,
  isApp: false,
});

/** The owner's template for a tester's wave post. Nothing private in it. */
export const VALIDATOR_FEEDBACK_TEMPLATE = [
  "Computer and system:",
  "File installed:",
  "Home or data center:",
  "Tor, on or off:",
  "What happened:",
  "Times, in UTC:",
].join("\n");
