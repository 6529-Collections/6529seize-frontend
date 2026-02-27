import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { RateMatter } from "@/types/enums";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
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
      <UserPageRateWrapper profile={profile} type={RateMatter.REP}>
        <UserPageRepNewRep
          profile={profile}
          repRates={repRates}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </UserPageRateWrapper>
    </MobileWrapperDialog>
  );
}
