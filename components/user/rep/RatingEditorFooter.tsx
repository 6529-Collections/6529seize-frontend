"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { KeyboardEvent, ReactNode } from "react";
import { t } from "@/i18n/messages";

export default function RatingEditorFooter({
  matter,
  formId,
  editable,
  changed,
  before,
  after,
  available,
  busy,
  canSave,
  onCancel,
  idleAction,
  children,
}: {
  readonly matter: "REP" | "NIC";
  readonly formId: string;
  readonly editable: boolean;
  readonly changed: boolean;
  readonly before: number;
  readonly after: number | null;
  readonly available: number | null;
  readonly busy: boolean;
  readonly canSave: boolean;
  readonly onCancel: () => void;
  readonly idleAction?: ReactNode;
  readonly children?: ReactNode;
}) {
  const locale = useBrowserLocale();
  let totalColor = "tw-text-iron-100";
  if (after !== null && after !== before) {
    totalColor = after < before ? "tw-text-rose-400" : "tw-text-emerald-400";
  }
  const onKeyDownCapture = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && changed && !busy) {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };
  if (!editable && (idleAction === undefined || idleAction === null))
    return null;
  return (
    <div className="tw-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pb-[max(8px,env(safe-area-inset-bottom))] tw-pl-2.5 tw-pr-1.5 tw-pt-2">
      <div className="tw-flex tw-min-h-[34px] tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        {changed ? (
          <output className="tw-text-[13px] tw-text-iron-400">
            {t(locale, "rep.categories.panel.total")}{" "}
            {formatInteger(locale, before)}
            {" → "}
            <span className={`tw-font-semibold ${totalColor}`}>
              {after === null ? "—" : formatInteger(locale, after)}
            </span>
          </output>
        ) : (
          idleAction
        )}
        {editable &&
          (changed ? (
            <div className="tw-ml-auto tw-flex tw-gap-2">
              <Button
                variant="ghost"
                size={null}
                className="tw-min-h-11 tw-px-3 tw-text-sm lg:tw-min-h-[34px]"
                onClick={onCancel}
                onKeyDownCapture={onKeyDownCapture}
                disabled={busy}
              >
                {t(locale, "rep.categories.edit.cancel")}
              </Button>
              <Button
                variant={matter === "NIC" ? "success" : "action"}
                size={null}
                className="tw-min-h-11 tw-px-4 tw-text-sm lg:tw-min-h-[34px]"
                type="submit"
                onKeyDownCapture={onKeyDownCapture}
                form={formId}
                loading={busy}
                disabled={!canSave}
              >
                {t(locale, "rep.categories.edit.save")}
              </Button>
            </div>
          ) : (
            <span className="tw-ml-auto tw-text-xs tw-text-iron-500">
              {t(locale, "user.rate.available", { matter })}{" "}
              <span className="tw-font-medium tw-text-iron-300">
                {available === null ? "—" : formatInteger(locale, available)}
              </span>
            </span>
          ))}
      </div>
      {children}
    </div>
  );
}
