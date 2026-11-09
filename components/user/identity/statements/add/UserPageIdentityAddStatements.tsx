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
  [STATEMENT_ADD_VIEW.SELECT]: "sm:tw-max-w-[28rem]",
  [STATEMENT_ADD_VIEW.CONTACT]: "sm:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT]: "sm:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.NFT_ACCOUNT]: "sm:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST]: "sm:tw-max-w-lg",
};

const VIEW_TITLE_KEYS: Record<STATEMENT_ADD_VIEW, MessageKey> = {
  [STATEMENT_ADD_VIEW.SELECT]:
    "user.profile.identity.statements.add.desktopTitle",
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
  "tw-sticky tw-top-0 tw-z-20 tw-bg-iron-950 !tw-px-5 tw-pb-0 tw-pt-6 sm:!tw-px-6";
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
      headerVariant="minimal"
      titleClassName={
        isSelectView
          ? "!tw-text-lg !tw-font-semibold tw-tracking-tight"
          : "!tw-text-base !tw-font-medium"
      }
      headerCloseButtonClassName={
        isSelectView
          ? "!tw-mr-0 [&>span]:tw-size-8 [&>span]:tw-border-0 [&>span]:tw-bg-white/[0.025]"
          : "!tw-mr-0"
      }
      surfaceClassName="tw-bg-iron-950 tw-shadow-xl"
    >
      <div
        ref={contentRef}
        className={
          isSelectView
            ? "tw-px-5 tw-pt-2 sm:tw-px-6"
            : "tw-px-4 tw-pb-4 sm:tw-px-6 md:tw-pb-6 md:tw-pt-6 lg:tw-px-8 lg:tw-pb-8"
        }
      >
        {!isSelectView && (
          <p className="tw-mb-4 tw-mt-0 tw-text-sm tw-leading-5 tw-text-iron-400">
            {t(locale, "user.profile.identity.statements.add.privacyNotice")}
          </p>
        )}
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
