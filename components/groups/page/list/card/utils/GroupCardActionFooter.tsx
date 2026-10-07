import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";

import Button from "@/components/utils/button/Button";

export default function GroupCardActionFooter({
  loading,
  disabled,
  onSave,
  onCancel,
  compact = false,
  saveButtonVariant = "action",
  children,
}: {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly compact?: boolean | undefined;
  readonly saveButtonVariant?: "action" | "success" | undefined;
  readonly children?: ReactNode;
}) {
  const locale = useBrowserLocale();
  return (
    <div
      className={
        compact
          ? "tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.03] tw-bg-black/20 tw-px-3 tw-py-2.5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between"
          : "tw-mt-auto tw-border-t tw-border-white/10 tw-pt-4"
      }
    >
      {children !== undefined && children !== null && (
        <div className="tw-min-w-0 tw-flex-1">{children}</div>
      )}
      <div
        className={
          compact
            ? "tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 sm:tw-w-auto"
            : "tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3"
        }
      >
        <Button
          onClick={onCancel}
          disabled={loading}
          variant={compact ? "ghost" : "secondary"}
          size="md"
          className={
            compact
              ? "tw-flex-1 touch-only:tw-min-h-11 sm:tw-flex-none"
              : undefined
          }
        >
          {t(locale, "network.groupInspection.cancel")}
        </Button>
        <Button
          onClick={onSave}
          loading={loading}
          disabled={disabled}
          variant={saveButtonVariant}
          size="md"
          className={
            compact
              ? "tw-flex-1 touch-only:tw-min-h-11 sm:tw-flex-none"
              : undefined
          }
        >
          {t(locale, "network.groupInspection.grant")}
        </Button>
      </div>
    </div>
  );
}
