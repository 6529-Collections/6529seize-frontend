"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useRef } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getCreateSubwaveTitle } from "@/helpers/waves/create-subwave-title.helpers";
import type { ApiIdentity } from "../../../generated/models/ApiIdentity";
import CreateWave from "./CreateWave";
import type { CreateWaveHandles } from "./CreateWave";
import CreateWaveProfileRequiredModal from "./CreateWaveProfileRequiredModal";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
import AuthLoadingPlaceholder from "@/components/auth/AuthLoadingPlaceholder";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isAuthResolving } from "@/components/auth/authResolution";

interface CreateWaveModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profile?: ApiIdentity | null;
  readonly parentWaveId?: string | null | undefined;
  readonly parentWaveName?: string | null | undefined;
  readonly parentAdminGroupId?: string | null | undefined;
  readonly parentViewGroupId?: string | null | undefined;
}

function CreateWaveConnectRequired({
  isOpen,
  onClose,
}: Pick<CreateWaveModalProps, "isOpen" | "onClose">) {
  const locale = useBrowserLocale();
  const { fetchingProfile } = useAuth();
  const { connectionState } = useSeizeConnectContext();
  return (
    <MobileWrapperDialog
      title={t(locale, "waves.create.quick.connectTitle")}
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={t(locale, "common.close")}
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      zIndexClassName="tw-z-[9999]"
    >
      {isAuthResolving(connectionState, fetchingProfile) ? (
        <AuthLoadingPlaceholder />
      ) : (
        <div className="tw-space-y-6 tw-px-4">
          <p className="tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "waves.create.quick.connectDescription")}
          </p>
          <HeaderUserConnect />
        </div>
      )}
    </MobileWrapperDialog>
  );
}

export default function CreateWaveModal({
  isOpen,
  onClose,
  profile,
  parentWaveId,
  parentWaveName,
  parentAdminGroupId,
  parentViewGroupId,
}: CreateWaveModalProps) {
  const locale = useBrowserLocale();
  const createWaveRef = useRef<CreateWaveHandles>(null);
  const requestClose = () => {
    if (createWaveRef.current) {
      createWaveRef.current.requestClose();
    } else {
      onClose();
    }
  };

  if (!profile)
    return <CreateWaveConnectRequired isOpen={isOpen} onClose={onClose} />;
  if (!profile.handle?.trim()) {
    return (
      <CreateWaveProfileRequiredModal
        isOpen={isOpen}
        onClose={onClose}
        profile={profile}
        returnTo={
          parentWaveId
            ? `/waves/${encodeURIComponent(parentWaveId)}`
            : "/waves/create"
        }
      />
    );
  }

  const title = parentWaveId
    ? getCreateSubwaveTitle(locale, parentWaveName)
    : t(locale, "waves.create.dialog.waveTitle");

  return (
    <MobileWrapperDialog
      title={title}
      isOpen={isOpen}
      onClose={requestClose}
      preserveFocusOnEscape
      closeLabel={t(locale, "common.close")}
      noPadding
      tall
      fixedHeight
      tabletModal
      maxWidthClass="md:tw-max-w-5xl"
      zIndexClassName="tw-z-[9999]"
      showHeaderCloseButton
      headerClassName="tw-flex-shrink-0 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/[0.06] tw-py-2 md:!tw-px-8 lg:tw-py-4"
      titleClassName="tw-m-0 tw-min-w-0 tw-break-words !tw-text-base !tw-font-semibold tw-leading-6 tw-tracking-wide tw-text-white"
      surfaceClassName="tw-border tw-border-solid tw-border-white/10 tw-bg-[#09090B] tw-shadow-[0_0_80px_rgba(0,0,0,0.8)] md:tw-max-h-[56rem] md:!tw-rounded-3xl"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <CreateWave
          key={`${profile.primary_wallet}:${profile.id ?? ""}`}
          ref={createWaveRef}
          profile={profile}
          onBack={onClose}
          onSuccess={onClose}
          parentWaveId={parentWaveId}
          parentWaveName={parentWaveName}
          parentAdminGroupId={parentAdminGroupId}
          parentViewGroupId={parentViewGroupId}
        />
      </div>
    </MobileWrapperDialog>
  );
}
