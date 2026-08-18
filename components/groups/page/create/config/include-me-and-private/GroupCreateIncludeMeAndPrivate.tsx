import { GROUP_CREATE_PANEL_STYLES } from "../../GroupCreate.styles";
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
    <div
      className={`${GROUP_CREATE_PANEL_STYLES} tw-inline-flex tw-items-center tw-space-x-8`}
    >
      <GroupCreateIncludeMe
        iAmIncluded={iAmIncluded}
        setIAmIncluded={setIAmIncluded}
      />
      <GroupCreatePrivate isPrivate={isPrivate} setIsPrivate={setIsPrivate} />
    </div>
  );
}
