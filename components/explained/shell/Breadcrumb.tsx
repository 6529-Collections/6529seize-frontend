import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { EX_FOCUS } from "../tokens";

export interface Crumb {
  readonly label: string;
  readonly href?: string;
}

/**
 * Where the page sits: "6529 Explained / 01 TDH / The daily check". On a
 * phone only the page itself shows; the chapter bar below carries the rest.
 */
export default function Breadcrumb({
  crumbs,
  locale,
}: {
  readonly crumbs: readonly Crumb[];
  readonly locale: SupportedLocale;
}) {
  return (
    <nav
      aria-label={kt(locale, "explained.kit.shell.crumbs")}
      className="tw-min-w-0"
    >
      <ol className="tw-m-0 tw-flex tw-min-w-0 tw-list-none tw-items-center tw-gap-2.5 tw-p-0 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400 md:tw-text-sm">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          const here = last ? "tw-font-semibold tw-text-iron-50" : "";
          const current = last ? { "aria-current": "page" as const } : {};
          return (
            <li
              key={`${crumb.label}-${crumb.href ?? ""}`}
              className={`tw-items-center tw-gap-2.5 ${last ? "tw-flex tw-min-w-0" : "tw-hidden lg:tw-flex"}`}
            >
              {last || crumb.href === undefined ? (
                <span className={`tw-truncate ${here}`} {...current}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={`tw-whitespace-nowrap tw-text-iron-400 tw-no-underline hover:tw-text-iron-50 ${EX_FOCUS}`}
                >
                  {crumb.label}
                </Link>
              )}
              {!last && (
                <span className="tw-text-iron-400" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
