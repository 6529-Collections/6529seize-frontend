"use client";

import { useContext } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { COLLECT_SECONDARY_ACTION_CLASS } from "./collect-action.styles";
import type { CollectActionView, CollectTradeAction } from "./collect.types";
import { CollectDetailHasPrimaryAction } from "./CollectDetailActionRow";
import CollectOwnerAction, {
  type CollectOwnerActionRenderer,
} from "./CollectOwnerAction";
import CollectTradeActions from "./CollectTradeActions";

/** Changes placement only; the owner control retains its checks and handlers. */
export default function CollectDetailSupportingActions({
  assetKey,
  title,
  locale,
  onTrade,
}: {
  readonly assetKey: string | undefined;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly onTrade: (
    action: CollectTradeAction,
    trigger: HTMLButtonElement | null
  ) => void;
}) {
  const hasCollect = useContext(CollectDetailHasPrimaryAction);
  const renderActions: CollectOwnerActionRenderer = (list, feedback) => {
    const actions: CollectActionView[] = [];
    if (hasCollect && list) {
      actions.push({
        action: "list",
        ...(list.disabledReason ? { disabledReason: list.disabledReason } : {}),
      });
    }
    actions.push({ action: "accept" });
    return (
      <>
        {!hasCollect && list && (
          <button
            data-collect-owner-action
            type="button"
            className={COLLECT_SECONDARY_ACTION_CLASS}
            disabled={Boolean(list.disabledReason)}
            aria-describedby={list.descriptionId}
            onClick={(event) => list.onSelect?.(event.currentTarget)}
          >
            {t(locale, "collect.menu.list")}
          </button>
        )}
        <CollectTradeActions
          actions={actions}
          title={title}
          locale={locale}
          onTrade={(action, trigger) => {
            if (action === "list") {
              if (trigger) list?.onSelect?.(trigger);
            } else onTrade(action, trigger);
          }}
        />
        {Boolean(feedback) && (
          <div
            data-collect-owner-feedback
            className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2"
          >
            {feedback}
          </div>
        )}
      </>
    );
  };
  return assetKey ? (
    <CollectOwnerAction
      assetKey={assetKey}
      onList={(trigger) => onTrade("list", trigger)}
      renderAction={renderActions}
    />
  ) : (
    renderActions(null, null)
  );
}
