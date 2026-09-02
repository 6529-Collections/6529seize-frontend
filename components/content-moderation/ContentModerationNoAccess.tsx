"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const REDIRECT_SECONDS = 10;

export default function ContentModerationNoAccess({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      if (seconds <= 1) {
        router.replace("/");
        return;
      }
      setSeconds((current) => current - 1);
    }, 1000);

    return () => globalThis.clearTimeout(timeout);
  }, [router, seconds]);

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-py-12 tw-text-center">
      <LockClosedIcon
        className="tw-size-24 tw-flex-shrink-0 tw-text-iron-500"
        aria-hidden="true"
      />
      <strong className="tw-text-lg tw-text-iron-200">
        {t(locale, "contentModeration.moderator.noPower")}
      </strong>
      <p className="tw-m-0 tw-text-base tw-text-iron-500">
        {t(locale, "contentModeration.moderator.redirecting", { seconds })}
      </p>
    </div>
  );
}
