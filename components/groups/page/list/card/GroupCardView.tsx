import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useId } from "react";
import GroupCardContent from "./GroupCardContent";
import GroupCardCreator from "./GroupCardCreator";
import GroupCardHeader from "./GroupCardHeader";

export default function GroupCardView({
  group,
  userPlaceholder,
}: {
  readonly group?: ApiGroupFull | undefined;
  readonly userPlaceholder?: string | undefined;
}) {
  const detailsId = useId();
  const href = group ? `/network?page=1&group=${group.id}` : undefined;

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-4 tw-px-4 tw-py-4 sm:tw-px-5 sm:tw-py-5">
      <GroupCardHeader href={href} detailsId={detailsId} />
      <div id={detailsId} className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-4">
        <GroupCardContent group={group} />
        <div className="tw-h-px tw-w-full tw-rounded-full tw-bg-white/10 tw-shadow-[0_1px_0_rgba(8,15,29,0.35)]" />
        <GroupCardCreator group={group} userPlaceholder={userPlaceholder} />
      </div>
    </div>
  );
}
