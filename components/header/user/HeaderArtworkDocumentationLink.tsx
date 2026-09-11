"use client";

import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useArtworkDocumentationAccess } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function HeaderArtworkDocumentationLink({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const { enabled } = useArtworkDocumentationAccess();
  const locale = useBrowserLocale();

  if (!enabled) return null;

  return (
    <Link
      href="/artwork-documentation"
      prefetch={false}
      onClick={onClose}
      className="tw-grid tw-min-h-11 tw-grid-cols-[1.5rem_minmax(0,1fr)] tw-items-center tw-gap-x-3 tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-md tw-font-medium tw-text-iron-300 tw-no-underline hover:tw-bg-iron-700 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      <DocumentTextIcon className="tw-size-5" aria-hidden="true" />
      <span>{t(locale, "artworkDocumentation.myWorks")}</span>
    </Link>
  );
}
