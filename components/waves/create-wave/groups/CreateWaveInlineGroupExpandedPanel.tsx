import type { ReactNode } from "react";
import Button from "@/components/utils/button/Button";

export default function CreateWaveInlineGroupExpandedPanel({
  children,
  onCancel,
  cancelClassName = "",
  cancelLabel = "Cancel",
}: {
  readonly children: ReactNode;
  readonly onCancel: () => void;
  readonly cancelClassName?: string;
  readonly cancelLabel?: string;
}) {
  return (
    <div className="tw-relative tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-5">
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-min-w-0 tw-flex-1">{children}</div>
        <Button
          variant="secondary"
          size="xs"
          onClick={onCancel}
          className={cancelClassName}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
