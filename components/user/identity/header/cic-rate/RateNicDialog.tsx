import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import UserPageRateWrapper from "@/components/user/utils/rate/UserPageRateWrapper";
import {
  USER_RATE_CANCEL_BUTTON_CLASS_NAME,
  USER_RATE_CLOSE_BUTTON_CLASS_NAME,
} from "@/components/user/utils/rate/userRateStyles";
import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { RateMatter } from "@/types/enums";
import UserPageIdentityHeaderCICRate from "./UserPageIdentityHeaderCICRate";

export default function RateNicDialog({
  profile,
  isOpen,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <MobileWrapperDialog
      title={t(locale, "user.rate.nic.title")}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      headerClassName="tw-mb-4"
      headerCloseButtonClassName={USER_RATE_CLOSE_BUTTON_CLASS_NAME}
    >
      <div className="tw-px-4 sm:tw-px-6">
        <UserPageRateWrapper
          profile={profile}
          type={RateMatter.NIC}
          unavailableFooter={
            <div className="tw-mt-6 tw-flex tw-justify-end">
              <Button
                variant="secondary"
                size="lg"
                className={USER_RATE_CANCEL_BUTTON_CLASS_NAME}
                onClick={onClose}
              >
                {t(locale, "rep.categories.grant.actions.cancel")}
              </Button>
            </div>
          }
        >
          <UserPageIdentityHeaderCICRate
            profile={profile}
            isTooltip={false}
            onSuccess={onClose}
            onCancel={onClose}
          />
        </UserPageRateWrapper>
      </div>
    </MobileWrapperDialog>
  );
}
