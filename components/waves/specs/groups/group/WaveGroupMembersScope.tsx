import WaveRulesGroupMembersLink from "@/components/waves/specs/WaveRulesGroupMembersLink";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import WaveGroupScope from "./WaveGroupScope";

export default function WaveGroupMembersScope({
  group,
}: {
  readonly group: ApiGroup;
}) {
  const groupId = group.id?.trim();
  const groupName = group.name?.trim();

  // The waves API viewer-scopes private groups: unauthorized viewers receive
  // only an is_hidden stub, while eligible DM participants receive the group.
  if (group.is_hidden || !groupId || !groupName) {
    return <WaveGroupScope group={group} />;
  }

  return (
    <WaveRulesGroupMembersLink
      groupId={groupId}
      groupName={groupName}
      href={`/network?page=1&group=${encodeURIComponent(groupId)}`}
      linkLabel={t(DEFAULT_LOCALE, "waves.chatSettings.access.inspectGroup", {
        groupName,
      })}
    />
  );
}
