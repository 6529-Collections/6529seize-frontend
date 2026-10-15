import { PHASE_PRODUCTION_BUILD } from "next/constants";

/** True while `next build` is prerendering pages, not while serving requests. */
export function isProductionBuildPhase(): boolean {
  return process.env["NEXT_PHASE"] === PHASE_PRODUCTION_BUILD;
}
