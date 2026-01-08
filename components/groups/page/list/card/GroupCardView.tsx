import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { GroupCardState } from "./GroupCard";
import GroupCardContent from "./GroupCardContent";
import GroupCardHeader from "./GroupCardHeader";

export default function GroupCardView({
  group,
  haveActiveGroupVoteAll,
  setState,
  onEditClick,
  userPlaceholder,
  titlePlaceholder,
}: {
  readonly group?: ApiGroupFull | undefined;
  readonly haveActiveGroupVoteAll: boolean;
  readonly setState?: ((state: GroupCardState) => void) | undefined;
  readonly onEditClick?:
    | ((group: ApiGroupFull) => void)
    | undefined
    | undefined;
  readonly userPlaceholder?: string | undefined;
  readonly titlePlaceholder?: string | undefined;
}) {
  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-4 tw-px-4 tw-py-4 sm:tw-px-5 sm:tw-py-5">
      <GroupCardHeader
        group={group}
        onEditClick={onEditClick}
        userPlaceholder={userPlaceholder}
      />
      <div className="tw-h-px tw-w-full tw-rounded-full tw-bg-white/10 tw-shadow-[0_1px_0_rgba(8,15,29,0.35)]" />
      <GroupCardContent
        group={group}
        haveActiveGroupVoteAll={haveActiveGroupVoteAll}
        setState={setState}
        titlePlaceholder={titlePlaceholder}
      />
    </div>
  );
}
