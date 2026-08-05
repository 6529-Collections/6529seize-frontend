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
      headerClassName="!tw-absolute tw-right-6 tw-top-7 tw-z-30 !tw-p-0 sm:tw-right-10"
      titleClassName="tw-sr-only"
      headerCloseButtonClassName="!tw-mr-0 !tw-h-8 !tw-w-8 !tw-rounded-md !tw-bg-iron-950 !tw-p-0 !tw-text-iron-500 !tw-ring-0 hover:!tw-bg-iron-900 hover:!tw-text-white focus:!tw-ring-0 focus-visible:!tw-ring-2 focus-visible:!tw-ring-primary-400/60 [&_svg]:!tw-h-5 [&_svg]:!tw-w-5"
    >
      <div
        className={`
          tw-px-6 sm:tw-px-10
          [&_.rep-category-header]:tw-pr-14 sm:[&_.rep-category-header]:tw-pr-16
        `}
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
