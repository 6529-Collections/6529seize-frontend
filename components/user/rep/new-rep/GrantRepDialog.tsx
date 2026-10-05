import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { RateMatter } from "@/types/enums";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import UserPageRateWrapper from "../../utils/rate/UserPageRateWrapper";
import UserPageRepNewRep from "./UserPageRepNewRep";

export default function GrantRepDialog({
  profile,
  overview,
  isOpen,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly overview: ApiRepOverview | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  return (
    <MobileWrapperDialog
      title="Grant Rep"
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      headerClassName="tw-mb-5"
      titleClassName="!tw-text-xl !tw-font-medium tw-tracking-tight"
      headerCloseButtonClassName="!tw-mr-0 !tw-h-10 !tw-w-10 !tw-rounded-lg !tw-p-0 !tw-text-iron-400 [&>span]:!tw-rounded-lg [&>span]:!tw-border-0 [&>span]:!tw-bg-transparent desktop-hover:hover:[&>span]:!tw-bg-iron-900 [&_svg]:!tw-h-5 [&_svg]:!tw-w-5"
    >
      <UserPageRateWrapper profile={profile} type={RateMatter.REP}>
        <UserPageRepNewRep
          profile={profile}
          overview={overview}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </UserPageRateWrapper>
    </MobileWrapperDialog>
  );
}
