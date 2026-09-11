import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumAcquisitionProgram,
  MuseumAcquisitionProgramStatus,
} from "@/lib/museum/publication/entities";

/**
 * Render the closed public program-status vocabulary as visitor-facing copy.
 * Unknown values are rejected so machine tokens cannot leak into the Museum.
 */
export function displayMuseumPublicAcquisitionProgramStatus(
  value: MuseumAcquisitionProgramStatus
): string {
  switch (value) {
    case "proposed":
      return t(DEFAULT_LOCALE, "museum.network.programs.status.proposed");
    case "open":
      return t(DEFAULT_LOCALE, "museum.network.programs.status.open");
    case "selection_complete":
      return t(
        DEFAULT_LOCALE,
        "museum.network.programs.status.selectionComplete"
      );
    case "acquisition_in_progress":
      return t(
        DEFAULT_LOCALE,
        "museum.network.programs.status.acquisitionInProgress"
      );
    case "completed":
      return t(DEFAULT_LOCALE, "museum.network.programs.status.completed");
    case "closed":
      return t(DEFAULT_LOCALE, "museum.network.programs.status.closed");
    default:
      throw new Error(`museum_acquisition_program_status:${String(value)}`);
  }
}

/** Read the optional typed program date without borrowing a Work date. */
export function museumPublicAcquisitionProgramStatusAsOf(
  program: MuseumAcquisitionProgram | undefined
): string | null {
  return program?.statusAsOf ?? null;
}
