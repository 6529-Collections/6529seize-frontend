"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export default function CommonTablePagination({
  small,
  currentPage,
  setCurrentPage,
  totalPages,
  haveNextPage,
  loading = false,
  showTopBorder = true,
  className,
}: {
  readonly small: boolean;
  readonly currentPage: number;
  readonly setCurrentPage: (page: number) => void;
  readonly totalPages: number | null;
  readonly haveNextPage: boolean;
  readonly loading?: boolean | undefined;
  readonly showTopBorder?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const formattedCurrentPage = formatInteger(locale, currentPage);

  return (
    <div
      className={`${
        small && showTopBorder
          ? "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 sm:tw-px-6"
          : ""
      } tw-pb-3 tw-pt-4 ${className ?? ""}`}
    >
      <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
        {typeof totalPages === "number" ? (
          <div className="tw-mr-3 tw-text-sm tw-font-medium tw-text-iron-300">
            {t(locale, "common.pagination.pageOf", {
              current: formattedCurrentPage,
              total: formatInteger(locale, totalPages),
            })}
          </div>
        ) : (
          <div></div>
        )}

        <span className="tw-isolate tw-inline-flex tw-gap-x-3 tw-rounded-md tw-shadow-sm">
          {currentPage > 1 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={loading}
            >
              <svg
                className="-tw-ml-1.5 tw-h-5 tw-w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{t(locale, "common.pagination.previous")}</span>
            </Button>
          )}
          {haveNextPage && (
            <Button
              variant="secondary"
              size="sm"
              disabled={loading}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <span>{t(locale, "common.pagination.next")}</span>
              <svg
                className="-tw-mr-1.5 tw-h-5 tw-w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          )}
        </span>
      </div>
    </div>
  );
}
