"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ApiIdentity } from "../../../generated/models/ApiIdentity";
import CreateWave from "./CreateWave";
import CreateWaveProfileRequiredModal from "./CreateWaveProfileRequiredModal";

interface CreateWaveModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
  readonly parentWaveId?: string | null | undefined;
  readonly parentAdminGroupId?: string | null | undefined;
}

export default function CreateWaveModal({
  isOpen,
  onClose,
  profile,
  parentWaveId,
  parentAdminGroupId,
}: CreateWaveModalProps) {
  const locale = useBrowserLocale();

  if (!profile.handle?.trim()) {
    return (
      <CreateWaveProfileRequiredModal
        isOpen={isOpen}
        onClose={onClose}
        profile={profile}
      />
    );
  }

  const title = t(
    locale,
    parentWaveId
      ? "waves.create.dialog.subwaveTitle"
      : "waves.create.dialog.waveTitle"
  );

  return (
    <MobileWrapperDialog
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={t(locale, "common.close")}
      noPadding
      tall
      fixedHeight
      tabletModal
      maxWidthClass="md:tw-max-w-5xl"
      zIndexClassName="tw-z-[9999]"
      showHeaderCloseButton
      headerClassName="tw-flex-shrink-0 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/[0.06] tw-py-2 md:!tw-px-8 lg:tw-py-4"
      titleClassName="tw-m-0 !tw-text-base !tw-font-semibold tw-leading-6 tw-tracking-wide tw-text-white"
      surfaceClassName="tw-border tw-border-solid tw-border-white/10 tw-bg-[#09090B] tw-shadow-[0_0_80px_rgba(0,0,0,0.8)] md:tw-max-h-[56rem] md:!tw-rounded-3xl"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <CreateWave
          profile={profile}
          onBack={onClose}
          onSuccess={onClose}
          parentWaveId={parentWaveId}
          parentAdminGroupId={parentAdminGroupId}
        />
      </div>
    </MobileWrapperDialog>
  );
}
