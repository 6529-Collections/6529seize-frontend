"use client";

import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import useCapacitor from "@/hooks/useCapacitor";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { AboutSection } from "@/types/enums";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { ReactNode } from "react";
import {
  getAboutNavItemHref,
  getAboutNavItemId,
  getAboutSectionLabel,
  getVisibleAboutNavGroups,
  isAboutSectionNavItem,
} from "./about.routes";

type AboutContentsDropdownProps = {
  readonly currentSection?: AboutSection | undefined;
  readonly currentHref?: string | undefined;
  readonly className?: string | undefined;
  readonly leadingAction?: ReactNode;
};

export function AboutContentsDropdown({
  currentSection,
  currentHref,
  className,
  leadingAction,
}: AboutContentsDropdownProps) {
  const locale = DEFAULT_LOCALE;
  const capacitor = useCapacitor();
  const cookieConsent = useOptionalCookieConsent();
  const hideSubscriptions =
    cookieConsent === undefined
      ? false
      : shouldHideSubscriptions({
          capacitorIsIos: capacitor.isIos,
          country: cookieConsent.country,
        });
  const groups = getVisibleAboutNavGroups(hideSubscriptions);
  const normalizedCurrentHref = normalizeAboutHref(currentHref);
  const currentItem = groups
    .flatMap((group) => group.items)
    .find((item) => {
      if (isAboutSectionNavItem(item)) {
        return currentSection === item.section;
      }

      return (
        normalizedCurrentHref === normalizeAboutHref(getAboutNavItemHref(item))
      );
    });
  const currentLabel =
    currentItem === undefined
      ? getAboutSectionLabel(currentSection, locale)
      : t(locale, currentItem.labelKey);
  const activeItemId =
    currentItem === undefined ? currentSection : getAboutNavItemId(currentItem);
  const items: CompactMenuItem[] = groups.flatMap((group) => [
    {
      id: `group-${group.id}`,
      kind: "section" as const,
      label: t(locale, group.labelKey),
    },
    ...group.items.map((item): CompactMenuItem => {
      const label = t(locale, item.labelKey);
      const itemHref = getAboutNavItemHref(item);
      const isCurrent = isAboutSectionNavItem(item)
        ? currentSection === item.section
        : normalizedCurrentHref === normalizeAboutHref(itemHref);

      return {
        id: getAboutNavItemId(item),
        label,
        href: itemHref,
        icon: isCurrent ? (
          <CheckIcon
            className="tw-size-4 tw-flex-shrink-0"
            aria-hidden="true"
          />
        ) : (
          <span className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
        ),
        active: isCurrent,
        ariaLabel: isCurrent
          ? t(locale, "about.contents.currentItemAriaLabel", {
              page: label,
            })
          : t(locale, "about.contents.itemAriaLabel", {
              page: label,
            }),
      };
    }),
  ]);

  return (
    <div
      className={clsx(
        "tw-sticky tw-top-16 tw-z-30 tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-bg-black/85 tw-py-2 tw-backdrop-blur-sm md:tw-top-0",
        leadingAction ? "tw-justify-between" : "tw-justify-end",
        className
      )}
    >
      {leadingAction}
      <CompactMenu
        aria-label={t(locale, "about.contents.triggerAriaLabel", {
          page: currentLabel,
        })}
        unstyledTrigger
        triggerClassName="tw-inline-flex tw-max-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-px-3 tw-py-2 tw-text-left tw-shadow-sm tw-transition tw-duration-200 tw-ease-out hover:tw-border-primary-400/60 hover:tw-bg-iron-900 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
        trigger={<AboutContentsDropdownTrigger currentLabel={currentLabel} />}
        items={items}
        activeItemId={activeItemId}
        anchor={{ to: "bottom end", gap: 8, padding: 16 }}
        menuWidthClassName="tw-w-72 tw-max-w-[calc(100vw-2rem)] sm:tw-w-80"
        header={<AboutContentsDropdownHeader />}
        headerClassName="tw-mb-1 tw-px-3 tw-pb-3 tw-pt-2"
        itemsWrapperClassName="tw-pr-2"
        menuClassName="tw-[scrollbar-gutter:stable] tw-max-h-80 tw-overflow-y-auto tw-overflow-x-hidden tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-p-2 tw-pr-3 tw-shadow-2xl tw-backdrop-blur tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 desktop-hover:hover:tw-scrollbar-thumb-iron-500 sm:tw-max-h-96"
        itemClassName="!tw-no-underline hover:!tw-no-underline focus:!tw-no-underline tw-px-3 tw-py-2.5"
        inactiveItemClassName="tw-text-iron-200 hover:tw-bg-iron-900 hover:tw-text-iron-50"
        focusItemClassName="tw-bg-iron-900 tw-text-iron-50"
      />
    </div>
  );
}

function normalizeAboutHref(href: string | undefined): string | undefined {
  if (href === undefined) {
    return undefined;
  }

  let path = href.slice(0, getPathEndIndex(href));
  while (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path === "" ? "/" : path;
}

function getPathEndIndex(href: string): number {
  const queryIndex = href.indexOf("?");
  const hashIndex = href.indexOf("#");

  if (queryIndex === -1) {
    return hashIndex === -1 ? href.length : hashIndex;
  }

  if (hashIndex === -1) {
    return queryIndex;
  }

  return Math.min(queryIndex, hashIndex);
}

function AboutContentsDropdownHeader() {
  const locale = DEFAULT_LOCALE;

  return (
    <div className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50">
      {t(locale, "about.contents.menuHeading")}
    </div>
  );
}

function AboutContentsDropdownTrigger({
  currentLabel,
}: {
  readonly currentLabel: string;
}) {
  return (
    <>
      <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50">
        {currentLabel}
      </span>
      <ChevronDownIcon
        className="tw-size-4 tw-flex-shrink-0 tw-text-iron-400"
        aria-hidden="true"
      />
    </>
  );
}
