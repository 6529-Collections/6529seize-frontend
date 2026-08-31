import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import {
  getGroupCriteriaIdentityLabel,
  type GroupCriteriaIdentityLabels,
} from "@/helpers/groups/group-criteria-summary";

const DIRECTION_LABELS: Record<ApiGroupFilterDirection, string> = {
  [ApiGroupFilterDirection.Received]: "from",
  [ApiGroupFilterDirection.Sent]: "to",
};

export const getGroupCardIdentityValue = ({
  identity,
  direction,
  identityLabels,
}: {
  readonly identity: string | null;
  readonly direction: ApiGroupFilterDirection | null;
  readonly identityLabels: GroupCriteriaIdentityLabels;
}): string | null => {
  const identityLabel = getGroupCriteriaIdentityLabel({
    identity,
    identityLabels,
  });
  if (!identityLabel) {
    return null;
  }

  const directionPrefix =
    direction !== null ? `${DIRECTION_LABELS[direction]} ` : "";
  return `${directionPrefix}identity: ${identityLabel}`;
};
