"use client";

import { useEffect, useState } from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function EmmaTitle() {
  const about = t(DEFAULT_LOCALE, "emma.about");
  const [showHelpLabel, setShowHelpLabel] = useState(false);
  useEffect(() => {
    if (!showHelpLabel) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowHelpLabel(false);
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [showHelpLabel]);
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <h1 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white">
        {t(DEFAULT_LOCALE, "emma.title")}
      </h1>
      <span
        className="tw-relative tw-inline-flex"
        onMouseEnter={() => setShowHelpLabel(true)}
        onMouseLeave={() => setShowHelpLabel(false)}
      >
        <Link
          href="/emma/help"
          aria-label={about}
          onFocus={() => setShowHelpLabel(true)}
          onBlur={() => setShowHelpLabel(false)}
          className="tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <QuestionMarkCircleIcon className="tw-size-5" aria-hidden="true" />
        </Link>
        {showHelpLabel && (
          // The link already has this name. Keep its visual label out of the
          // accessibility tree to avoid announcing the same text twice.
          <span
            aria-hidden="true"
            className="tw-absolute tw-left-0 tw-top-full tw-z-10 tw-whitespace-nowrap tw-rounded-md tw-bg-iron-700 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-white tw-shadow-lg"
          >
            {about}
          </span>
        )}
      </span>
    </div>
  );
}
