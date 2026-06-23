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
      maxWidthClass="md:tw-max-w-5xl md:[&_h2]:tw-mt-2"
      showScrollbar
    >
      <div className="tw-px-4 sm:tw-px-6">
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
