import GroupCreateIncludeMe from "./GroupCreateIncludeMe";
import GroupCreatePrivate from "./GroupCreatePrivate";

export default function GroupCreateIncludeMeAndPrivate({
  isPrivate,
  setIsPrivate,
  iAmIncluded,
  setIAmIncluded,
}: {
  readonly isPrivate: boolean;
  readonly iAmIncluded: boolean;
  readonly setIsPrivate: (isPrivate: boolean) => void;
  readonly setIAmIncluded: (iAmIncluded: boolean) => void;
}) {
  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800 tw-inline-flex tw-items-center tw-space-x-8">
      <GroupCreateIncludeMe iAmIncluded={iAmIncluded} setIAmIncluded={setIAmIncluded} />
      <GroupCreatePrivate isPrivate={isPrivate} setIsPrivate={setIsPrivate} />
    </div>
  );
}
