import { publicEnv } from "@/config/env";

/**
 * The build flag. Off: the records mode is never read and every personal
 * settings write goes as today. On: GET /signed-records/mode decides.
 */
export const isPersonalRecordsEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_PERSONAL_RECORDS === "true";
