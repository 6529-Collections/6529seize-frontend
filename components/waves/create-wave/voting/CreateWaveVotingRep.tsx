import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";
import IdentitySearch from "../../../utils/input/identity/IdentitySearch";
import RepCategorySearch from "../../../utils/input/rep-category/RepCategorySearch";

export default function CreateWaveVotingRep({
  category,
  profileId,
  errors,
  setCategory,
  setProfileId,
}: {
  readonly category: string | null;
  readonly profileId: string | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setCategory: (newV: string | null) => void;
  readonly setProfileId: (newV: string | null) => void;
}) {
  const isCategoryError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_REQUIRED
  );

  const isProfileIdError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_REQUIRED
  );
  return (
    <div className="tw-grid md:tw-grid-cols-2 tw-gap-4">
      <RepCategorySearch
        category={category}
        setCategory={setCategory}
        error={isCategoryError}
      />
      <IdentitySearch
        identity={profileId}
        setIdentity={setProfileId}
        error={isProfileIdError}      />
    </div>
  );
}
