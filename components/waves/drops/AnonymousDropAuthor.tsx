"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function AnonymousAuthorName() {
  const locale = useBrowserLocale();
  return (
    <span data-anonymous-author className="tw-text-iron-300">
      {t(locale, "competitions.anonymousAuthor")}
    </span>
  );
}

export function AnonymousAuthorAvatar({
  className = "tw-h-10 tw-w-10",
}: {
  readonly className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`${className} tw-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10`}
    >
      <UserIcon className="tw-h-5 tw-w-5 tw-text-iron-500" />
    </div>
  );
}

export default function AnonymousDropAuthor() {
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5 tw-font-semibold">
      <AnonymousAuthorAvatar />
      <AnonymousAuthorName />
    </div>
  );
}
