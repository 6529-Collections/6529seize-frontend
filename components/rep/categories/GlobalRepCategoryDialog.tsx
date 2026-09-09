"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import GlobalRepCategoryDetail from "./GlobalRepCategoryDetail";

export default function GlobalRepCategoryDialog({
  category,
  isOpen,
  onClose,
}: {
  readonly category: string | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  return (
    <MobileWrapperDialog
      title={category ? `${category} REP` : "REP Category"}
      isOpen={isOpen}
      onClose={onClose}
      tall
      fixedHeight
      tabletModal
      maxWidthClass="md:tw-max-w-4xl"
      zIndexClassName="tw-z-[1010]"
      showScrollbar
      showHeaderCloseButton
      surfaceClassName="tw-bg-iron-950"
      headerClassName="!tw-absolute tw-right-4 tw-top-4 tw-z-30 !tw-p-0 sm:tw-right-10 sm:tw-top-6"
      titleClassName="tw-sr-only"
    >
      <div
        className={`tw-px-6 tw-pt-4 sm:tw-px-10 sm:tw-pt-6 [&_.rep-category-header]:tw-pr-14 sm:[&_.rep-category-header]:tw-pr-16`}
      >
        {category && (
          <GlobalRepCategoryDetail
            category={category}
            mode="dialog"
            showFullPageLink
          />
        )}
      </div>
    </MobileWrapperDialog>
  );
}
