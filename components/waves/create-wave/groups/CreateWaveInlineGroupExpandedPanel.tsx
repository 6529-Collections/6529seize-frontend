import type { ReactNode } from "react";

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
        <button
          type="button"
          onClick={onCancel}
          className={`tw-flex-shrink-0 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-500 tw-transition tw-duration-200 desktop-hover:hover:tw-text-iron-100 ${cancelClassName}`}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
