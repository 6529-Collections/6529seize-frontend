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
