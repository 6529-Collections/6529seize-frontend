"use client";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as SavedBookmarkIcon } from "@heroicons/react/24/solid";
import { useBookmarkOwner } from "@/hooks/drops/useDropBookmarks";
import { useDropBookmarkMutation } from "@/hooks/drops/useDropBookmarkMutation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function WaveDropBookmarkAction(
  props: Parameters<typeof AuthenticatedBookmarkAction>[0]
) {
  const owner = useBookmarkOwner();
  return owner && !props.dropId.startsWith("temp-") ? (
    <AuthenticatedBookmarkAction {...props} />
  ) : null;
}
function AuthenticatedBookmarkAction({
  dropId,
  onSelected,
  mobile = false,
  knownBookmarked,
}: {
  readonly dropId: string;
  readonly onSelected?: (() => void) | undefined;
  readonly mobile?: boolean;
  readonly knownBookmarked?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const bookmark = useDropBookmarkMutation(dropId, knownBookmarked);
  if (!bookmark.canBookmark || dropId.startsWith("temp-")) return null;
  const Icon = bookmark.bookmarked ? SavedBookmarkIcon : BookmarkIcon;
  let labelKey: "bookmarks.retry" | "bookmarks.remove" | "bookmarks.add" =
    "bookmarks.add";
  if (bookmark.bookmarked) labelKey = "bookmarks.remove";
  if (bookmark.failed) labelKey = "bookmarks.retry";
  const label = t(locale, labelKey);
  return (
    <button
      type="button"
      disabled={bookmark.pending}
      aria-busy={bookmark.pending}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        if (bookmark.failed) {
          void bookmark.retry();
          return;
        }
        bookmark.toggle();
        onSelected?.();
      }}
      className={
        mobile
          ? "tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-iron-300 active:tw-bg-iron-800 disabled:tw-opacity-50"
          : "tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-iron-300 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
      }
    >
      <Icon
        className={mobile ? "tw-size-5 tw-shrink-0" : "tw-size-4 tw-shrink-0"}
        aria-hidden="true"
      />
      <span
        className={
          mobile ? "tw-text-base tw-font-semibold" : "tw-text-sm tw-font-medium"
        }
      >
        {label}
      </span>
    </button>
  );
}
