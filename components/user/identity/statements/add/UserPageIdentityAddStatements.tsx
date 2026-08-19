"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { useRef, useState } from "react";
import { STATEMENT_ADD_VIEW } from "./UserPageIdentityAddStatements.constants";
import UserPageIdentityAddStatementsViews from "./UserPageIdentityAddStatementsViews";

const VIEW_W_CLASS: Record<STATEMENT_ADD_VIEW, string> = {
  [STATEMENT_ADD_VIEW.SELECT]: "sm:tw-max-w-[74rem]",
  [STATEMENT_ADD_VIEW.CONTACT]: "sm:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT]: "sm:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.NFT_ACCOUNT]: "sm:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST]: "sm:tw-max-w-lg",
};

const VIEW_TITLE_KEYS: Record<STATEMENT_ADD_VIEW, MessageKey> = {
  [STATEMENT_ADD_VIEW.SELECT]:
    "user.profile.identity.statements.add.dialogTitle",
  [STATEMENT_ADD_VIEW.CONTACT]:
    "user.profile.identity.statements.add.contactDialogTitle",
  [STATEMENT_ADD_VIEW.NFT_ACCOUNT]:
    "user.profile.identity.statements.add.nftDialogTitle",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT]:
    "user.profile.identity.statements.add.socialDialogTitle",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST]:
    "user.profile.identity.statements.add.verificationDialogTitle",
};

const SELECT_HEADER_CLASS_NAME =
  "tw-sticky tw-top-0 tw-z-20 tw-bg-iron-950 tw-pb-3 tw-pt-4 md:!tw-absolute md:tw-right-6 md:tw-top-6 md:!tw-p-0";
const DETAIL_HEADER_CLASS_NAME =
  "tw-sticky tw-top-0 tw-z-20 tw-bg-iron-950 tw-pb-4 tw-pt-4 md:!tw-pb-0 md:tw-pt-6";

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
  const contentRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(contentRef);

  const [activeView, setActiveView] = useState<STATEMENT_ADD_VIEW>(
    STATEMENT_ADD_VIEW.SELECT
  );
  const isSelectView = activeView === STATEMENT_ADD_VIEW.SELECT;

  return (
    <MobileWrapperDialog
      title={t(locale, VIEW_TITLE_KEYS[activeView])}
      isOpen={isOpen}
      onClose={onClose}
      onBack={
        isSelectView
          ? undefined
          : () => setActiveView(STATEMENT_ADD_VIEW.SELECT)
      }
      onAfterLeave={() => setActiveView(STATEMENT_ADD_VIEW.SELECT)}
      tabletModal
      noPadding
      showScrollbar
      enableDragToClose
      maxWidthClass={VIEW_W_CLASS[activeView]}
      zIndexClassName="tw-z-[1100]"
      headerClassName={
        isSelectView ? SELECT_HEADER_CLASS_NAME : DETAIL_HEADER_CLASS_NAME
      }
      titleClassName={isSelectView ? "md:tw-sr-only" : undefined}
      surfaceClassName="tw-bg-iron-950 tw-shadow-xl"
    >
      <div
        ref={contentRef}
        className={
          isSelectView
            ? "tw-px-4 tw-pb-4 sm:tw-px-6 md:tw-py-6 lg:tw-px-8 lg:tw-py-8"
            : "tw-px-4 tw-pb-4 sm:tw-px-6 md:tw-pb-6 md:tw-pt-6 lg:tw-px-8 lg:tw-pb-8"
        }
      >
        <UserPageIdentityAddStatementsViews
          profile={profile}
          activeView={activeView}
          setActiveView={setActiveView}
          onClose={onClose}
        />
      </div>
    </MobileWrapperDialog>
  );
}
