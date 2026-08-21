"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface CreateWaveProfileRequiredModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
}

const getIdentityHref = (profile: ApiIdentity): string => {
  const identity = profile.primary_wallet.trim() || profile.query?.trim();
  return identity ? `/${encodeURIComponent(identity)}` : "/profile";
};

export default function CreateWaveProfileRequiredModal({
  isOpen,
  onClose,
  profile,
}: CreateWaveProfileRequiredModalProps) {
  const locale = useBrowserLocale();

  return (
    <MobileWrapperDialog
      title={t(locale, "waves.create.dialog.profileRequiredTitle")}
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={t(locale, "common.close")}
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      zIndexClassName="tw-z-[9999]"
      surfaceClassName="tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl"
    >
      <div className="tw-px-4 sm:tw-px-6">
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "waves.create.dialog.profileRequiredDescription")}
        </p>

        <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row-reverse sm:tw-justify-start">
          <ButtonLink
            href={getIdentityHref(profile)}
            variant="primary"
            size="lg"
            fullWidth
            className="sm:tw-w-auto"
          >
            {t(locale, "waves.create.dialog.profileRequiredConfirm")}
          </ButtonLink>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            size="lg"
            fullWidth
            className="sm:tw-w-auto"
          >
            {t(locale, "waves.create.dialog.profileRequiredCancel")}
          </Button>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
