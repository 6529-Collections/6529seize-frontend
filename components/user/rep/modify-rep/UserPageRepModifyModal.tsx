"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import RepCategoryEditForm from "../rep-category-modal/RepCategoryEditForm";
import RepCategoryRatersList from "../rep-category-modal/RepCategoryRatersList";

export default function UserPageRepModifyModal({
  onClose,
  profile,
  category,
  canEditRep,
  categoryRep,
  contributorCount,
}: {
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
  readonly category: string;
  readonly canEditRep: boolean;
  readonly categoryRep?: number;
  readonly contributorCount?: number;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (globalThis.document === undefined || globalThis.window === undefined) {
      return;
    }

    const currentWindow = globalThis.window;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      currentWindow.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  if (!isMounted || globalThis.document === undefined) {
    return null;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1100] tw-cursor-default">
      <div className="tw-absolute tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]" />
      <div className="tw-relative tw-flex tw-min-h-full tw-w-full tw-overflow-y-auto tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
        <div
          ref={modalRef}
          className="sm:tw-max-w-md tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6 tw-max-h-[85vh] tw-overflow-y-auto">
          {canEditRep ? (
            <RepCategoryEditForm
              profile={profile}
              category={category}
              onClose={onClose}
            />
          ) : (
            <>
              <div className="tw-flex tw-justify-between tw-items-start">
                <p className="tw-text-lg tw-text-iron-50 tw-font-semibold tw-mb-0">
                  {category}
                </p>
                <button
                  onClick={onClose}
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="tw-sr-only tw-text-sm">Close</span>
                  <svg
                    className="tw-h-6 tw-w-6"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="tw-flex tw-items-center tw-gap-4 tw-mt-4 tw-pb-4 tw-border-b tw-border-solid tw-border-iron-800/60 tw-border-x-0 tw-border-t-0">
                <div>
                  <div className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
                    Total Rep
                  </div>
                  <div className="tw-text-lg tw-font-semibold tw-text-iron-100">
                    {formatNumberWithCommas(categoryRep ?? 0)}
                  </div>
                </div>
                <div className="tw-h-8 tw-w-px tw-bg-iron-800" />
                <div>
                  <div className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
                    Raters
                  </div>
                  <div className="tw-text-lg tw-font-semibold tw-text-iron-100">
                    {formatNumberWithCommas(contributorCount ?? 0)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Raters */}
          <div className={`${canEditRep ? "tw-mt-6" : "tw-mt-2"} tw-border-t tw-border-solid tw-border-iron-800/60 tw-border-x-0 tw-border-b-0 tw-pt-4`}>
            {canEditRep && (
              <div className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                Raters
              </div>
            )}
            <RepCategoryRatersList
              handleOrWallet={
                profile.handle ?? profile.primary_wallet ?? ""
              }
              category={category}
            />
          </div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
