"use client";
import { useRef } from "react";
import BookmarkCard from "./BookmarkCard";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/auth/Auth";
import {
  useBookmarks,
  useBookmarkStatus,
} from "@/hooks/drops/useDropBookmarks";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const errorMessageKey = "bookmarks.error" as const;
const buttonClass =
  "tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";
export default function BookmarksPage() {
  const locale = useBrowserLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { connectedProfile, isAuthenticated, fetchingProfile } = useAuth();
  const { owner } = useBookmarkStatus();
  const query = useBookmarks();

  const drops = owner
    ? [
        ...new Map(
          query.data?.pages
            .flatMap((page) => page.data)
            .map((drop) => [drop.id, drop]) ?? []
        ).values(),
      ]
    : [];
  let moreLabel: "bookmarks.loading" | "bookmarks.retry" | "bookmarks.more" =
    "bookmarks.more";
  if (query.isFetchNextPageError) moreLabel = "bookmarks.retry";
  if (query.isFetchingNextPage) moreLabel = "bookmarks.loading";
  let statusMessage = "";
  let content;
  if (fetchingProfile || (owner && query.isLoading)) {
    statusMessage = t(locale, "bookmarks.loading");
    content = (
      <p className="tw-py-12 tw-text-center tw-text-iron-400">
        {t(locale, "bookmarks.loading")}
      </p>
    );
  } else if (!owner) {
    content = (
      <div className="tw-space-y-4 tw-py-12 tw-text-center">
        <p className="tw-text-iron-400">{t(locale, "bookmarks.signIn")}</p>
        <HeaderUserConnect label={t(locale, "bookmarks.connect")} />
      </div>
    );
  } else if (query.isError && drops.length === 0) {
    statusMessage = t(locale, errorMessageKey);
    content = (
      <div className="tw-space-y-4 tw-py-12 tw-text-center">
        <p className="tw-text-iron-400">{t(locale, errorMessageKey)}</p>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            void query.refetch();
          }}
        >
          {t(locale, "bookmarks.retry")}
        </button>
      </div>
    );
  } else if (drops.length === 0) {
    statusMessage = t(locale, "bookmarks.empty");
    content = (
      <div className="tw-py-16 tw-text-center">
        <BookmarkIcon
          className="tw-mx-auto tw-size-10 tw-text-iron-500"
          aria-hidden="true"
        />
        <h2 className="tw-mt-5 tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, "bookmarks.empty")}
        </h2>
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "bookmarks.emptyDescription")}
        </p>
      </div>
    );
  } else {
    statusMessage = t(
      locale,
      query.isError ? errorMessageKey : "bookmarks.loaded"
    );
    content = (
      <div className="tw-space-y-5">
        {drops.map((drop) => (
          <BookmarkCard
            key={drop.id}
            apiDrop={drop}
            onRemoved={() => headingRef.current?.focus()}
          />
        ))}
        {query.isFetchNextPageError && (
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, errorMessageKey)}
          </p>
        )}
        {query.hasNextPage && (
          <div className="tw-flex tw-justify-center tw-py-4">
            <button
              type="button"
              className={buttonClass}
              disabled={query.isFetchingNextPage}
              onClick={() => {
                void query.fetchNextPage();
              }}
            >
              {t(locale, moreLabel)}
            </button>
          </div>
        )}
      </div>
    );
  }
  return (
    <main
      data-sentry-mask
      className="ph-no-capture tw-mx-auto tw-w-full tw-max-w-3xl tw-px-4 tw-py-6 sm:tw-px-6"
    >
      <output className="tw-sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </output>
      <header className="tw-mb-6">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(locale, "bookmarks.title")}
        </h1>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
          {t(locale, "bookmarks.private")}
        </p>
      </header>
      <div
        key={`${connectedProfile?.id ?? "signed-out"}:${isAuthenticated === true}`}
        aria-busy={query.isFetching}
      >
        {content}
      </div>
    </main>
  );
}
