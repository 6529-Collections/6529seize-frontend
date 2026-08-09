import type { MuseumAcquisitionProgramStatus } from "@/lib/museum/publication/entities";

/**
 * Render the closed public program-status vocabulary as visitor-facing copy.
 * Unknown values are rejected so machine tokens cannot leak into the Museum.
 */
export function displayMuseumPublicAcquisitionProgramStatus(
  value: MuseumAcquisitionProgramStatus
): string {
  switch (value) {
    case "proposed":
      return "Program proposed";
    case "open":
      return "Program open";
    case "selection_complete":
      return "Selection complete";
    case "acquisition_in_progress":
      return "Acquisition in progress";
    case "completed":
      return "Program complete";
    case "closed":
      return "Program closed";
    default:
      throw new Error(`museum_acquisition_program_status:${String(value)}`);
  }
}

/** Read the optional typed program date without borrowing a Work date. */
export function museumPublicAcquisitionProgramStatusAsOf(
  program: object | undefined
): string | null {
  if (program === undefined || !("statusAsOf" in program)) return null;
  const statusAsOf = program.statusAsOf;
  return typeof statusAsOf === "string" && statusAsOf.trim().length > 0
    ? statusAsOf
    : null;
}
