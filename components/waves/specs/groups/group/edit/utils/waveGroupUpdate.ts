import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { WaveGroupType } from "../../WaveGroup.types";

const waveGroupUpdatePaths = {
  [WaveGroupType.VIEW]: ["visibility", "scope", "group_id"],
  [WaveGroupType.DROP]: ["participation", "scope", "group_id"],
  [WaveGroupType.VOTE]: ["voting", "scope", "group_id"],
  [WaveGroupType.CHAT]: ["chat", "scope", "group_id"],
  [WaveGroupType.ADMIN]: ["wave", "admin_group", "group_id"],
} as const satisfies Record<WaveGroupType, readonly string[]>;

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const cloneWithValueAtPath = (
  body: ApiUpdateWaveRequest,
  path: readonly string[],
  value: string | null,
): ApiUpdateWaveRequest => {
  const clone: ApiUpdateWaveRequest = { ...body };
  let currentSource: Record<string, unknown> | undefined =
    body as unknown as Record<string, unknown>;
  let currentTarget: Record<string, unknown> =
    clone as unknown as Record<string, unknown>;

  for (let index = 0; index < path.length; index += 1) {
    const segment = path[index];
    if (index === path.length - 1) {
      currentTarget[segment] = value;
      break;
    }

    const nextSource = toRecord(currentSource?.[segment]);
    const nextTarget = { ...nextSource };

    currentTarget[segment] = nextTarget;
    currentSource = nextSource;
    currentTarget = nextTarget;
  }

  return clone;
};

export const updateGroupIdByType = (
  body: ApiUpdateWaveRequest,
  type: WaveGroupType,
  groupId: string | null,
): ApiUpdateWaveRequest => {
  const path = waveGroupUpdatePaths[type];
  return cloneWithValueAtPath(body, path, groupId);
};

export const getGroupIdByType = (
  body: ApiUpdateWaveRequest,
  type: WaveGroupType,
): string | null => {
  const path = waveGroupUpdatePaths[type];
  let current: unknown = body;

  for (const segment of path) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" || current === null ? current : null;
};
