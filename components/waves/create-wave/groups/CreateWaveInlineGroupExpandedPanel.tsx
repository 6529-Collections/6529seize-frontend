import type { ReactNode } from "react";
import Button from "@/components/utils/button/Button";
import type { ButtonSize } from "@/components/utils/button/buttonStyles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveInlineGroupExpandedPanel({
  children,
  onCancel,
  cancelClassName = "",
  cancelLabel,
  cancelSize = "md",
  showCancel = true,
  quiet = false,
}: {
  readonly children: ReactNode;
  readonly onCancel: () => void;
  readonly cancelClassName?: string;
  readonly cancelLabel?: string;
  readonly cancelSize?: ButtonSize;
  readonly showCancel?: boolean;
  readonly quiet?: boolean;
}) {
  const locale = useBrowserLocale();
  const cancelControl = (
    <Button
      variant="secondary"
      size={cancelSize}
      onClick={onCancel}
      className={quiet ? `${cancelClassName} tw-min-h-11` : cancelClassName}
    >
      {cancelLabel ?? t(locale, "common.close")}
    </Button>
  );
  let panelContent: ReactNode = children;
  if (showCancel) {
    panelContent = quiet ? (
      <div className="tw-flex tw-flex-col-reverse tw-gap-3">
        <div className="tw-min-w-0">{children}</div>
        <div className="tw-flex tw-justify-end">{cancelControl}</div>
      </div>
    ) : (
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-min-w-0 tw-flex-1">{children}</div>
        {cancelControl}
      </div>
    );
  }

  return (
    <div
      className={
        quiet
          ? "tw-relative tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4"
          : "tw-relative tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-5"
      }
    >
      {panelContent}
    </div>
  );
}
