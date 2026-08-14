"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import { useRef, useState } from "react";
import UserPageIdentityAddStatementsViews from "./UserPageIdentityAddStatementsViews";

export enum STATEMENT_ADD_VIEW {
  SELECT = "SELECT",
  CONTACT = "CONTACT",
  NFT_ACCOUNT = "NFT_ACCOUNT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  SOCIAL_MEDIA_VERIFICATION_POST = "SOCIAL_MEDIA_VERIFICATION_POST",
}

const VIEW_W_CLASS: Record<STATEMENT_ADD_VIEW, string> = {
  [STATEMENT_ADD_VIEW.SELECT]: "md:tw-max-w-[74rem]",
  [STATEMENT_ADD_VIEW.CONTACT]: "md:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT]: "md:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.NFT_ACCOUNT]: "md:tw-max-w-[26.25rem]",
  [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST]: "md:tw-max-w-lg",
};

export default function UserPageIdentityAddStatements({
  profile,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly onClose: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(contentRef);

  const [activeView, setActiveView] = useState<STATEMENT_ADD_VIEW>(
    STATEMENT_ADD_VIEW.SELECT
  );

  // Each statement view retains its existing close button.
  return (
    <MobileWrapperDialog
      isOpen
      onClose={onClose}
      tabletModal
      showScrollbar
      maxWidthClass={VIEW_W_CLASS[activeView]}
      zIndexClassName="tw-z-[1100]"
      mobileCloseButtonClassName="!tw-hidden"
      headerCloseButtonClassName="md:!tw-hidden"
      surfaceClassName="tw-bg-iron-950 tw-shadow-xl"
    >
      <div
        ref={contentRef}
        className="tw-px-6 lg:tw-px-8 lg:tw-py-2"
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
