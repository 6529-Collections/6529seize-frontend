"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1100] tw-cursor-default"
    >
      <div className="tw-absolute tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]" />
      <div className="tw-relative tw-flex tw-min-h-full tw-w-full tw-items-end tw-justify-center tw-overflow-y-auto tw-p-2 tw-text-center sm:tw-items-center lg:tw-p-0">
        <div
          ref={modalRef}
          className="tw-relative tw-max-h-[85vh] tw-w-full tw-transform tw-overflow-y-auto tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-w-full sm:tw-max-w-md"
        >
          {canEditRep ? (
            <RepCategoryEditForm
              profile={profile}
              category={category}
              onClose={onClose}
            />
          ) : (
            <>
              <div className="tw-flex tw-items-start tw-justify-between">
                <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                  Rep Ratings for {category}
                </p>
                <button
                  onClick={onClose}
                  type="button"
                  className="-tw-mt-2 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950 tw-p-2.5 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50 focus:tw-outline-none"
                >
                  <span className="tw-sr-only tw-text-sm">Close</span>
                  <XMarkIcon className="tw-h-6 tw-w-6" />
                </button>
              </div>
              <div className="tw-mt-4 tw-flex tw-items-center tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/60 tw-pb-4">
                <span className="tw-text-sm tw-text-iron-400">
                  <span className="tw-font-semibold tw-text-iron-100">{formatNumberWithCommas(categoryRep ?? 0)}</span>{" "}
                  Rep
                </span>
                <span className="tw-text-iron-600">·</span>
                <span className="tw-text-sm tw-text-iron-400">
                  <span className="tw-font-semibold tw-text-iron-100">{formatNumberWithCommas(contributorCount ?? 0)}</span>{" "}
                  {contributorCount === 1 ? "rater" : "raters"}
                </span>
              </div>
            </>
          )}

          {/* Raters */}
          <div
            className={`${canEditRep ? "tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/60 tw-pt-4" : " "}`}
          >
            {canEditRep && (
              <div className="tw-mb-2 tw-flex tw-items-center tw-gap-4">
                <span className="tw-text-sm tw-text-iron-400">
                  <span className="tw-font-semibold tw-text-iron-100">{formatNumberWithCommas(categoryRep ?? 0)}</span>{" "}
                  Rep
                </span>
                <span className="tw-text-iron-600">·</span>
                <span className="tw-text-sm tw-text-iron-400">
                  <span className="tw-font-semibold tw-text-iron-100">{formatNumberWithCommas(contributorCount ?? 0)}</span>{" "}
                  {contributorCount === 1 ? "rater" : "raters"}
                </span>
              </div>
            )}
            <RepCategoryRatersList
              handleOrWallet={profile.handle ?? profile.primary_wallet ?? ""}
              category={category}
            />
          </div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
