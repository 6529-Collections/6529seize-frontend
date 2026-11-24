import clsx from "clsx";

export function getMobileDialogContentClassNames({
  allowOverflow,
  noPadding,
  showScrollbar,
  hasDragHandle,
  tabletModal,
  scrollableContent,
}: {
  readonly allowOverflow?: boolean | undefined;
  readonly noPadding?: boolean | undefined;
  readonly showScrollbar?: boolean | undefined;
  readonly hasDragHandle: boolean;
  readonly tabletModal?: boolean | undefined;
  readonly scrollableContent: boolean;
}) {
  let paddingClassName = "tw-py-0";
  if (!noPadding) {
    paddingClassName = clsx(
      "tw-pb-6",
      hasDragHandle ? "tw-pt-0" : "tw-pt-4",
      hasDragHandle && tabletModal && "md:tw-pt-4"
    );
  }

  let overflowClassName = "tw-overflow-hidden";
  if (allowOverflow) {
    overflowClassName =
      "mobile-wrapper-dialog-overflow-content tw-overflow-visible";
  } else if (scrollableContent) {
    overflowClassName = "tw-overflow-y-auto";
  }

  return clsx(
    "tw-flex tw-min-h-0 tw-flex-1 tw-scroll-py-3 tw-flex-col",
    overflowClassName,
    paddingClassName,
    showScrollbar &&
      scrollableContent &&
      !allowOverflow &&
      "tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
  );
}
