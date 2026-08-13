import type { ReactNode } from "react";
import Button from "@/components/utils/button/Button";
import type { ButtonSize } from "@/components/utils/button/buttonStyles";

export default function CreateWaveInlineGroupExpandedPanel({
  children,
  onCancel,
  cancelClassName = "",
  cancelLabel = "Cancel",
  cancelSize = "md",
  showCancel = true,
}: {
  readonly children: ReactNode;
  readonly onCancel: () => void;
  readonly cancelClassName?: string;
  readonly cancelLabel?: string;
  readonly cancelSize?: ButtonSize;
  readonly showCancel?: boolean;
}) {
  return (
    <div className="tw-relative tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-5">
      {showCancel ? (
        <div className="tw-flex tw-items-start tw-gap-3">
          <div className="tw-min-w-0 tw-flex-1">{children}</div>
          <Button
            variant="secondary"
            size={cancelSize}
            onClick={onCancel}
            className={`!tw-h-12 sm:!tw-h-11 ${cancelClassName}`}
          >
            {cancelLabel}
          </Button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
