import { CASEY_GENERATIVE_STUDIES } from "./casey";
import type { MuseumGenerativeStudy } from "./types";

export {
  CASEY_GENERATIVE_STUDIES,
  GENERATIVE_STUDY_SHARED_NOTES,
} from "./casey";
export type {
  MuseumDynamicStateVisualization,
  MuseumExhaustiveLatticeVisualization,
  MuseumFiniteCombinatorialVisualization,
  MuseumGenerativeStudy,
  MuseumHeldPosition,
  MuseumMintedProjectIndex,
  MuseumMintedToken,
  MuseumSampledFieldVisualization,
} from "./types";

export function getGenerativeStudyByProjectSlug(
  projectSlug: string
): MuseumGenerativeStudy | null {
  return (
    CASEY_GENERATIVE_STUDIES.find(
      (study) => study.projectSlug === projectSlug
    ) ?? null
  );
}

export function getGenerativeStudyByObjectId(
  objectId: string
): MuseumGenerativeStudy | null {
  return (
    CASEY_GENERATIVE_STUDIES.find((study) =>
      study.heldPositions.some((position) => position.objectId === objectId)
    ) ?? null
  );
}
