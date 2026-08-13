import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import IdentitySearch from "@/components/utils/input/identity/IdentitySearch";
import RepCategorySearch from "@/components/utils/input/rep-category/RepCategorySearch";

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
    CREATE_WAVE_VALIDATION_ERROR.VOTING_CATEGORY_CANNOT_BE_EMPTY
  );

  const isProfileIdError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.VOTING_PROFILE_ID_CANNOT_BE_EMPTY
  );
  const getInputClassName = (hasError: boolean): string =>
    `!tw-bg-iron-900 !tw-shadow-inner focus:!tw-bg-iron-900 focus:!tw-ring-1 focus:!tw-ring-inset ${
      hasError
        ? ""
        : "!tw-ring-white/5 desktop-hover:hover:!tw-ring-white/10 desktop-hover:hover:focus:!tw-ring-primary-400 focus:!tw-border-primary-500/50 focus:!tw-ring-primary-400"
    }`;
  const labelClassName = "!tw-bg-iron-900 peer-focus:!tw-bg-iron-900";

  return (
    <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
      <RepCategorySearch
        category={category}
        setCategory={setCategory}
        error={isCategoryError}
        inputClassName={getInputClassName(isCategoryError)}
        labelClassName={labelClassName}
      />
      <IdentitySearch
        identity={profileId}
        setIdentity={setProfileId}
        error={isProfileIdError}
        iconPositionClassName="tw-top-1/2 -tw-translate-y-1/2"
        inputClassName={getInputClassName(isProfileIdError)}
        labelClassName={labelClassName}
      />
    </div>
  );
}
