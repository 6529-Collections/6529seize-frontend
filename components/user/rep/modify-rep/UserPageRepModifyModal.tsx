"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useState } from "react";
import UserPageRepModifyForm from "./UserPageRepModifyForm";

export default function UserPageRepModifyModal({
  onClose,
  profile,
  category,
}: {
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
  readonly category: string;
}) {
  const locale = useBrowserLocale();
  const [isOpen, setIsOpen] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <MobileWrapperDialog
      title={t(locale, "rep.categories.edit.title", {
        name: profile.query ?? profile.handle ?? profile.display,
      })}
      isOpen={isOpen}
      dismissible={!isBusy}
      onClose={close}
      onAfterLeave={onClose}
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      headerVariant="minimal"
    >
      <UserPageRepModifyForm
        profile={profile}
        category={category}
        onCancel={close}
        onSuccess={close}
        onBusyChange={setIsBusy}
      />
    </MobileWrapperDialog>
  );
}
