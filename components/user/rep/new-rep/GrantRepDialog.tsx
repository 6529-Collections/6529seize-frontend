import { USER_RATE_CLOSE_BUTTON_CLASS_NAME } from "@/components/user/utils/rate/userRateStyles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
  return (
    <MobileWrapperDialog
      title={t(locale, "user.rate.rep.title")}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      headerClassName="tw-mb-4"
      headerCloseButtonClassName={USER_RATE_CLOSE_BUTTON_CLASS_NAME}
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
