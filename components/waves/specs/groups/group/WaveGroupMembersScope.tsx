import WaveRulesGroupMembersLink from "@/components/waves/specs/WaveRulesGroupMembersLink";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function WaveGroupMembersScope({
  group,
  groupDetails,
}: {
  readonly group: ApiGroup;
  readonly groupDetails?: ApiGroupFull | undefined;
}) {
  const groupId = group.id?.trim();

  // The waves API viewer-scopes private groups: unauthorized viewers receive
  // only an is_hidden stub, while eligible DM participants receive the group.
  if (group.is_hidden || !groupId) {
    return (
      <span className="tw-py-0.5 tw-font-medium tw-text-iron-50">
        {t(
          DEFAULT_LOCALE,
          group.is_hidden || group.is_direct_message
            ? "waves.chatSettings.access.privateGroup"
            : "waves.chatSettings.access.unavailableGroup"
        )}
      </span>
    );
  }

  return (
    <WaveRulesGroupMembersLink groupId={groupId} groupDetails={groupDetails} />
  );
}
