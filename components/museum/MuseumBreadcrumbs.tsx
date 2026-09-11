import Link from "next/link";
import type { MuseumBreadcrumbItem } from "@/lib/museum/publication/ia";

interface MuseumBreadcrumbsProps {
  readonly ariaLabel: string;
  readonly items: readonly MuseumBreadcrumbItem[];
}

export function MuseumBreadcrumbs({
  ariaLabel,
  items,
}: MuseumBreadcrumbsProps) {
  const visibleItems = items.filter((item) => item.label.trim().length > 0);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className="tw-mb-6 tw-min-w-0">
      <ol className="tw-m-0 tw-flex tw-min-w-0 tw-list-none tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-p-0 tw-text-sm tw-leading-6">
        {visibleItems.map((item, index) => {
          const isCurrent = index === visibleItems.length - 1;

          return (
            <li
              key={item.href ?? item.label}
              className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-2"
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="tw-hidden tw-text-iron-600 sm:tw-inline"
                >
                  /
                </span>
              ) : null}
              {isCurrent || item.href === undefined ? (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className="tw-max-w-full tw-break-words tw-text-iron-300"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  prefetch={false}
                  className="tw-inline-flex tw-min-h-11 tw-max-w-full tw-items-center tw-break-words tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
