"use client";
import Link from "next/link";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import {
  useBookmarkOwner,
  useBookmarkStatus,
} from "@/hooks/drops/useDropBookmarks";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
export default function HeaderBookmarksLink(props: {
  readonly onClose: () => void;
}) {
  const owner = useBookmarkOwner();
  return owner ? <AuthenticatedBookmarksLink {...props} /> : null;
}
function AuthenticatedBookmarksLink({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const { hasBookmarks } = useBookmarkStatus();
  const locale = useBrowserLocale();
  if (!hasBookmarks) return null;
  return (
    <Link
      href="/bookmarks"
      prefetch={false}
      onClick={onClose}
      className="tw-grid tw-min-h-11 tw-grid-cols-[1.5rem_minmax(0,1fr)] tw-items-center tw-gap-x-3 tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-md tw-font-medium tw-text-iron-300 tw-no-underline hover:tw-bg-iron-700 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      <BookmarkIcon className="tw-size-5" aria-hidden="true" />
      <span>{t(locale, "bookmarks.title")}</span>
    </Link>
  );
}
