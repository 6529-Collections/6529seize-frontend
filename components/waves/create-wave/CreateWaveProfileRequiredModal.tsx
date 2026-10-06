"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface CreateWaveProfileRequiredModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
  readonly returnTo?: string;
}

const getIdentityHref = (profile: ApiIdentity, returnTo: string): string => {
  const identity = profile.primary_wallet.trim() || profile.query?.trim();
  const path = identity ? `/${encodeURIComponent(identity)}` : "/profile";
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
};

export default function CreateWaveProfileRequiredModal({
  isOpen,
  onClose,
  profile,
  returnTo = "/waves/create",
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

        <div className="tw-mt-6 tw-flex sm:tw-justify-end">
          <ButtonLink
            href={getIdentityHref(profile, returnTo)}
            variant="primary"
            size="lg"
            fullWidth
            className="sm:tw-w-auto"
          >
            {t(locale, "waves.create.dialog.profileRequiredConfirm")}
          </ButtonLink>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
