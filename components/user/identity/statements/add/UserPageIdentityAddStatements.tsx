"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserPageIdentityAddStatementsViews from "./UserPageIdentityAddStatementsViews";

export enum STATEMENT_ADD_VIEW {
  SELECT = "SELECT",
  CONTACT = "CONTACT",
  NFT_ACCOUNT = "NFT_ACCOUNT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  SOCIAL_MEDIA_VERIFICATION_POST = "SOCIAL_MEDIA_VERIFICATION_POST",
}

export default function UserPageIdentityAddStatements({
  profile,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [activeView, setActiveView] = useState<STATEMENT_ADD_VIEW>(
    STATEMENT_ADD_VIEW.SELECT
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (
      !isMounted ||
      globalThis.document === undefined ||
      globalThis.window === undefined
    ) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      globalThis.window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isMounted]);

  const VIEW_W_CLASS: Record<STATEMENT_ADD_VIEW, string> = {
    [STATEMENT_ADD_VIEW.SELECT]: "sm:tw-max-w-[74rem]",
    [STATEMENT_ADD_VIEW.CONTACT]: "sm:tw-max-w-[26.25rem]",
    [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT]: "sm:tw-max-w-[26.25rem]",
    [STATEMENT_ADD_VIEW.NFT_ACCOUNT]: "sm:tw-max-w-[26.25rem]",
    [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST]: "sm:tw-max-w-lg",
  };

  if (!isMounted || globalThis.document === undefined) {
    return null;
  }

  return createPortal(
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1100]">
      <button
        type="button"
        aria-label="Close add statements modal"
        className="tw-absolute tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] tw-cursor-pointer tw-border-none tw-p-0"
        onClick={onClose}
      />
      <div className="tw-relative tw-flex tw-min-h-full tw-w-full tw-overflow-y-auto tw-items-center tw-justify-center tw-p-2 lg:tw-p-4">
        <div
          ref={modalRef}
          className={`${VIEW_W_CLASS[activeView]} tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6 lg:tw-p-8`}>
          <UserPageIdentityAddStatementsViews
            profile={profile}
            activeView={activeView}
            setActiveView={setActiveView}
            onClose={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
