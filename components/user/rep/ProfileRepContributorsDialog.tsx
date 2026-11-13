import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import ProfileRatingsDialog from "./ProfileRatingsDialog";
import RepContributorsDialog from "./RepContributorsDialog";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { RepDialogState } from "./repDialogs.types";

export default function ProfileRepContributorsDialog({
  profile,
  dialog,
  overview,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly dialog: RepDialogState | null;
  readonly overview?: ApiRepOverview | null;
  readonly onClose: () => void;
}) {
  if (dialog?.type !== "contributors") return null;
  const category = dialog.scope === "category" ? dialog.category : null;
  const contributorCount =
    dialog.scope === "overview"
      ? (overview?.contributor_count ?? dialog.contributorCount)
      : dialog.contributorCount;
  if (dialog.direction === "received")
    return (
      <RepContributorsDialog
        identity={profile.query ?? profile.handle ?? profile.display}
        isOpen
        scope={dialog.scope}
        direction="received"
        category={category}
        contributorCount={contributorCount}
        onClose={onClose}
      />
    );

  return (
    <ProfileRatingsDialog
      profile={profile}
      matter="REP"
      direction={dialog.direction}
      category={category}
      contributorCount={contributorCount}
      total={dialog.scope === "overview" ? overview?.total_rep : undefined}
      onClose={onClose}
    />
  );
}
