import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import GroupCardContent from "./GroupCardContent";
import GroupCardCreator from "./GroupCardCreator";
import GroupCardHeader from "./GroupCardHeader";

export default function GroupCardView({
  group,
  userPlaceholder,
  title,
  href,
}: {
  readonly group?: ApiGroupFull | undefined;
  readonly userPlaceholder?: string | undefined;
  readonly title: string;
  readonly href?: string | undefined;
}) {
  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-4 tw-px-4 tw-py-4 sm:tw-px-5 sm:tw-py-5">
      <GroupCardHeader title={title} href={href} />
      <GroupCardContent group={group} />
      <div className="tw-h-px tw-w-full tw-rounded-full tw-bg-white/10 tw-shadow-[0_1px_0_rgba(8,15,29,0.35)]" />
      <GroupCardCreator group={group} userPlaceholder={userPlaceholder} />
    </div>
  );
}
