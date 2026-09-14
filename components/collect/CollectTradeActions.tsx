"use client";

import { CompactMenu } from "@/components/compact-menu";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CheckCircleIcon,
  EllipsisHorizontalIcon,
  ArrowRightIcon,
  ChatBubbleLeftIcon,
  DocumentPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useId, useRef } from "react";
import type { CollectActionView, CollectTradeAction } from "./collect.types";

const ACTION_ICONS = {
  buy: ArrowRightIcon,
  offer: ChatBubbleLeftIcon,
  list: DocumentPlusIcon,
  accept: CheckCircleIcon,
  cancel: XCircleIcon,
};
const ACTION_LABELS = {
  buy: "collect.acquire",
  offer: "collect.menu.offer",
  list: "collect.menu.list",
  accept: "collect.menu.accept",
  cancel: "collect.action.cancel",
} as const;

/** Opens the existing trade review; selecting an action never signs a trade. */
export default function CollectTradeActions({
  actions,
  title,
  locale,
  onTrade,
}: {
  readonly actions: readonly CollectActionView[];
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly onTrade: (
    action: CollectTradeAction,
    trigger: HTMLButtonElement | null
  ) => void;
}) {
  const reasonId = useId();
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const buy = actions.find(({ action }) => action === "buy");
  const secondary = actions.filter(({ action }) => action !== "buy");
  const label = (action: CollectTradeAction) =>
    t(locale, "collect.actionFor", {
      action: t(locale, ACTION_LABELS[action]),
      title,
    });
  return (
    <div className="tw-min-w-0">
      <div className="tw-flex tw-items-center tw-gap-1">
        {buy && (
          <button
            type="button"
            disabled={Boolean(buy.disabledReason)}
            aria-label={t(locale, "collect.acquireFor", { title })}
            aria-describedby={buy.disabledReason ? reasonId : undefined}
            onClick={(event) => onTrade("buy", event.currentTarget)}
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-font-medium tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-text-white"
          >
            {t(locale, "collect.acquire")}
            <ArrowRightIcon
              aria-hidden="true"
              className="tw-size-4 tw-shrink-0"
            />
          </button>
        )}
        {secondary.length > 0 && (
          <CompactMenu
            aria-label={t(locale, "collect.moreActions", { title })}
            triggerAsChild
            trigger={
              <button
                ref={menuTrigger}
                type="button"
                className="tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-white"
              >
                <EllipsisHorizontalIcon
                  aria-hidden="true"
                  className="tw-size-5"
                />
              </button>
            }
            menuWidthClassName="tw-w-64"
            itemClassName="tw-min-h-11"
            items={secondary.map(({ action, disabledReason }) => {
              const Icon = ACTION_ICONS[action];
              return {
                id: action,
                label: (
                  <>
                    <span className="tw-block">
                      {t(locale, ACTION_LABELS[action])}
                    </span>
                    {disabledReason && (
                      <span className="tw-mt-1 tw-block tw-text-xs tw-font-normal">
                        {disabledReason}
                      </span>
                    )}
                  </>
                ),
                icon: (
                  <Icon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
                ),
                ariaLabel: disabledReason
                  ? t(locale, "collect.disabledAction", {
                      action: label(action),
                      reason: disabledReason,
                    })
                  : label(action),
                disabled: Boolean(disabledReason),
                onSelect: () => {
                  menuTrigger.current?.focus();
                  onTrade(action, menuTrigger.current);
                },
              };
            })}
          />
        )}
      </div>
      {buy?.disabledReason && (
        <p
          id={reasonId}
          className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-4 tw-text-iron-400"
        >
          {buy.disabledReason}
        </p>
      )}
    </div>
  );
}
