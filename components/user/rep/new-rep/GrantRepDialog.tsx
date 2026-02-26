import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { RateMatter } from "@/types/enums";

import UserPageRateWrapper from "../../utils/rate/UserPageRateWrapper";

import UserPageRepNewRep from "./UserPageRepNewRep";

export default function GrantRepDialog({
  profile,
  repRates,
  isOpen,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly repRates: ApiProfileRepRatesState | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  return (
    <MobileWrapperDialog
      title="Grant Rep"
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
    >
      <div className="tw-px-4 sm:tw-px-6">
        <UserPageRateWrapper profile={profile} type={RateMatter.REP}>
          <UserPageRepNewRep
            profile={profile}
            repRates={repRates}
            onSuccess={onClose}
          />
        </UserPageRateWrapper>
        <div className="tw-mt-3">
          <button
            onClick={onClose}
            type="button"
            className="tw-w-full tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
