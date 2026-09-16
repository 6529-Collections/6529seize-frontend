import type { ApiDropCuration } from "@/generated/models/ApiDropCuration";
import type { ApiDropCurationRequest } from "@/generated/models/ApiDropCurationRequest";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

export type CurationDropPlacement = "before" | "after";
export type CurationDropMove = {
  readonly placement: CurationDropPlacement;
  readonly anchorDropId: string;
};

export class CurationOrderChangedError extends Error {
  constructor() {
    super("Curation membership or permissions changed.");
    this.name = "CurationOrderChangedError";
  }
}

async function fetchDropPriority(dropId: string, curationId: string) {
  const curations = await commonApiFetch<ApiDropCuration[]>({
    endpoint: `drops/${dropId}/curations`,
    errorMode: "structured",
  });
  const membership = curations.find((curation) => curation.id === curationId);
  const priority = membership?.drop_priority_order;
  if (
    !membership?.drop_included ||
    !membership.authenticated_user_can_curate ||
    typeof priority !== "number" ||
    !Number.isSafeInteger(priority) ||
    priority < 1
  ) {
    throw new CurationOrderChangedError();
  }
  return priority;
}

export async function moveCurationDrop(
  request: {
    readonly dropId: string;
    readonly curationId: string;
  } & CurationDropMove
): Promise<void> {
  const { dropId, curationId, placement, anchorDropId } = request;
  if (dropId === anchorDropId) return;

  // Read actual ranks: the visible page can be incomplete or stale after a move.
  const [sourcePriority, anchorPriority] = await Promise.all([
    fetchDropPriority(dropId, curationId),
    fetchDropPriority(anchorDropId, curationId),
  ]);
  if (sourcePriority === anchorPriority) throw new CurationOrderChangedError();

  // Highest rank is first. Removing a lower-ranked source shifts the anchor down.
  const anchorAfterRemoval =
    anchorPriority - (sourcePriority < anchorPriority ? 1 : 0);
  const priorityOrder = anchorAfterRemoval + (placement === "before" ? 1 : 0);
  if (priorityOrder === sourcePriority) return;

  await savePriority(dropId, curationId, priorityOrder);
}

async function savePriority(
  dropId: string,
  curationId: string,
  priorityOrder: number
) {
  await commonApiPost<ApiDropCurationRequest, void>({
    endpoint: `drops/${dropId}/curations`,
    body: { curation_id: curationId, priority_order: priorityOrder },
    parseJson: false,
    errorMode: "structured",
  });
}
