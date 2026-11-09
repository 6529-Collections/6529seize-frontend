import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import ProfileRatingsDialog from "./ProfileRatingsDialog";
import RepContributorsDialog from "./RepContributorsDialog";
import type { RepDialogState } from "./repDialogs.types";

export default function ProfileRepContributorsDialog({
  profile,
  identity,
  dialog,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly identity: string;
  readonly dialog: RepDialogState | null;
  readonly onClose: () => void;
}) {
  if (dialog?.type !== "contributors") return null;
  const category = dialog.scope === "category" ? dialog.category : null;
  if (dialog.direction === "given")
    return (
      <ProfileRatingsDialog
        profile={profile}
        matter="REP"
        direction="given"
        category={category}
        onClose={onClose}
      />
    );
  return (
    <RepContributorsDialog
      identity={identity}
      isOpen
      scope={dialog.scope}
      direction={dialog.direction}
      category={category}
      contributorCount={dialog.contributorCount}
      onClose={onClose}
    />
  );
}
