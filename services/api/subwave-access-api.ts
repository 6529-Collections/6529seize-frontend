import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { validateWaveGroups } from "@/services/api/wave-group-validation-api";

export interface SubwaveAccessCheck {
  readonly parentWaveId: string | null | undefined;
  readonly viewGroupId: string | null;
}

export async function hasSubwaveMembersOutsideParent(
  { parentWaveId, viewGroupId }: SubwaveAccessCheck,
  signal?: AbortSignal
): Promise<boolean> {
  if (!parentWaveId) {
    return false;
  }

  const parentWave = await commonApiFetch<ApiWave>({
    endpoint: `waves/${encodeURIComponent(parentWaveId)}`,
    signal,
  });
  const parentViewGroupId = parentWave.visibility.scope.group?.id ?? null;
  if (parentViewGroupId === null || parentViewGroupId === viewGroupId) {
    return false;
  }
  if (viewGroupId === null) {
    return true;
  }

  // The containment endpoint compares complete group audiences. Use its Chat
  // slot for the candidate audience without checking unrelated permissions.
  const result = await validateWaveGroups(
    { visibility_group_id: parentViewGroupId, chat_group_id: viewGroupId },
    signal
  );
  return !result.valid;
}
