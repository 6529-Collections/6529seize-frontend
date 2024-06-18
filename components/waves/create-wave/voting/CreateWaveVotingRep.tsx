import IdentitySearch from "../../../utils/input/identity/IdentitySearch";
import RepCategorySearch from "../../../utils/input/rep-category/RepCategorySearch";

export default function CreateWaveVotingRep({
  category,
  profileId,
  setCategory,
  setProfileId,
}: {
  readonly category: string | null;
  readonly profileId: string | null;
  readonly setCategory: (newV: string | null) => void;
  readonly setProfileId: (newV: string | null) => void;
}) {
  return (
    <div className="tw-grid md:tw-grid-cols-2 tw-gap-4">
      <RepCategorySearch category={category} setCategory={setCategory} />
      <IdentitySearch identity={profileId} setIdentity={setProfileId} />
    </div>
  );
}
