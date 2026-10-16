import { publicEnv } from "@/config/env";
import { tdhRulesSchema, type TdhRules } from "./tdh-rules.helpers";

/** The boost rules change with a new season or schedule, not hourly. */
const TDH_RULES_REVALIDATE_SECONDS = 600;
const FETCH_TIMEOUT_MS = 8_000;

/**
 * The current TDH rules (`/api/tdh/rules`), read on the server so the pages
 * that show them render with the values in place. A failure returns null and
 * the page's own request in the browser takes over; the server copy is never
 * an error panel.
 */
export async function loadTdhRules(): Promise<TdhRules | null> {
  try {
    const response = await fetch(`${publicEnv.API_ENDPOINT}/api/tdh/rules`, {
      headers: { Accept: "application/json" },
      next: { revalidate: TDH_RULES_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const parsed = tdhRulesSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
