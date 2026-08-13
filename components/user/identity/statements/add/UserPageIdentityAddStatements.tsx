"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { useState } from "react";
import UserPageIdentityAddStatementsViews from "./UserPageIdentityAddStatementsViews";

export enum STATEMENT_ADD_VIEW {
  SELECT = "SELECT",
  CONTACT = "CONTACT",
  NFT_ACCOUNT = "NFT_ACCOUNT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  SOCIAL_MEDIA_VERIFICATION_POST = "SOCIAL_MEDIA_VERIFICATION_POST",
}

const VIEW_TITLE_KEYS: Record<STATEMENT_ADD_VIEW, MessageKey> = {
  [STATEMENT_ADD_VIEW.SELECT]:
    "user.profile.identity.statements.addTitle",
  [STATEMENT_ADD_VIEW.CONTACT]:
    "user.profile.identity.statements.addContactDialogTitle",
  [STATEMENT_ADD_VIEW.NFT_ACCOUNT]:
    "user.profile.identity.statements.addNftDialogTitle",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT]:
    "user.profile.identity.statements.addSocialDialogTitle",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST]:
    "user.profile.identity.statements.addVerificationDialogTitle",
};

const DETAIL_DIALOG_WIDTH_CLASS = "md:tw-max-w-lg";

const VIEW_WIDTH_CLASSES: Record<STATEMENT_ADD_VIEW, string> = {
  [STATEMENT_ADD_VIEW.SELECT]: "md:tw-max-w-4xl",
  [STATEMENT_ADD_VIEW.CONTACT]: DETAIL_DIALOG_WIDTH_CLASS,
  [STATEMENT_ADD_VIEW.NFT_ACCOUNT]: DETAIL_DIALOG_WIDTH_CLASS,
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT]: DETAIL_DIALOG_WIDTH_CLASS,
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST]:
    DETAIL_DIALOG_WIDTH_CLASS,
};

export default function UserPageIdentityAddStatements({
  profile,
  isOpen,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const [activeView, setActiveView] = useState<STATEMENT_ADD_VIEW>(
    STATEMENT_ADD_VIEW.SELECT
  );

  return (
    <MobileWrapperDialog
      title={t(locale, VIEW_TITLE_KEYS[activeView])}
      isOpen={isOpen}
      onClose={onClose}
      onAfterLeave={() => setActiveView(STATEMENT_ADD_VIEW.SELECT)}
      tall
      tabletModal
      showScrollbar
      showHeaderCloseButton
      maxWidthClass={VIEW_WIDTH_CLASSES[activeView]}
      headerClassName="-tw-mt-2 md:tw-mt-0"
    >
      <UserPageIdentityAddStatementsViews
        profile={profile}
        activeView={activeView}
        setActiveView={setActiveView}
        onBack={() => setActiveView(STATEMENT_ADD_VIEW.SELECT)}
        onClose={onClose}
      />
    </MobileWrapperDialog>
  );
}
