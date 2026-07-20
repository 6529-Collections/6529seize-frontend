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
      maxWidthClass="md:tw-max-w-4xl [&>div:first-child]:!tw-right-4 [&>div:first-child]:!tw-top-0 [&>div:first-child]:tw-z-30 [&>div:first-child]:!tw-pr-0 sm:[&>div:first-child]:!tw-right-8"
      zIndexClassName="tw-z-[1010]"
      showScrollbar
      surfaceClassName="tw-bg-iron-950"
      headerClassName="!tw-absolute tw-right-6 tw-top-6 tw-z-30 !tw-p-0 sm:tw-right-10 sm:tw-top-8"
      titleClassName="tw-sr-only"
      mobileCloseButtonClassName="!tw-mr-0 !tw-rounded-lg tw-h-10 tw-w-10 tw-bg-iron-950 tw-p-0 tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-ring-primary-400"
      headerCloseButtonClassName="!tw-mr-0 !tw-rounded-lg tw-h-10 tw-w-10 tw-bg-iron-950 tw-p-0 tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-ring-primary-400"
    >
      <div className="tw-px-6 sm:tw-px-10 [&_.rep-category-eyebrow]:!tw-text-xs [&_.rep-category-eyebrow]:!tw-font-semibold [&_.rep-category-eyebrow]:!tw-uppercase [&_.rep-category-eyebrow]:!tw-tracking-wider [&_.rep-category-eyebrow]:!tw-text-iron-500 [&_.rep-category-full-page]:!tw-rounded-lg [&_.rep-category-full-page]:!tw-border-iron-800 [&_.rep-category-full-page]:!tw-bg-iron-950 [&_.rep-category-full-page]:!tw-px-5 [&_.rep-category-full-page]:!tw-text-[0.8125rem] [&_.rep-category-full-page]:!tw-font-medium [&_.rep-category-full-page]:!tw-text-iron-300 hover:[&_.rep-category-full-page]:!tw-bg-iron-900 hover:[&_.rep-category-full-page]:!tw-text-white [&_.rep-category-header]:tw-pr-14 sm:[&_.rep-category-header]:tw-pr-16 [&_.rep-category-layout]:!tw-gap-8 [&_.rep-category-load-more]:!tw-rounded-lg [&_.rep-category-load-more]:!tw-border-iron-800 [&_.rep-category-load-more]:!tw-bg-iron-950 [&_.rep-category-load-more]:!tw-px-5 hover:[&_.rep-category-load-more]:!tw-bg-iron-900 [&_.rep-category-metric-label]:!tw-mb-1.5 [&_.rep-category-metric-label]:!tw-text-xs [&_.rep-category-metric-label]:!tw-font-semibold [&_.rep-category-metric-label]:!tw-uppercase [&_.rep-category-metric-label]:!tw-tracking-wider [&_.rep-category-metric-label]:!tw-text-iron-500 [&_.rep-category-metric-value]:!tw-text-3xl [&_.rep-category-metric-value]:!tw-font-normal [&_.rep-category-metric-value]:!tw-tracking-tight [&_.rep-category-metric-value]:!tw-text-iron-200 [&_.rep-category-metric:first-child_.rep-category-metric-value]:!tw-font-semibold [&_.rep-category-metric:first-child_.rep-category-metric-value]:!tw-text-iron-50 [&_.rep-category-metric]:!tw-rounded-lg [&_.rep-category-metric]:!tw-border-0 [&_.rep-category-metric]:!tw-bg-transparent [&_.rep-category-metric]:!tw-px-2 [&_.rep-category-metric]:!tw-py-1 [&_.rep-category-metrics]:!tw-gap-x-8 [&_.rep-category-metrics]:!tw-gap-y-6 [&_.rep-category-overview]:!tw-gap-8 [&_.rep-category-preview-grid]:!tw-gap-x-12 [&_.rep-category-preview-grid]:!tw-gap-y-10 [&_.rep-category-preview-grid]:tw-border-b-0 [&_.rep-category-preview-grid]:tw-border-l-0 [&_.rep-category-preview-grid]:tw-border-r-0 [&_.rep-category-preview-grid]:tw-border-t [&_.rep-category-preview-grid]:tw-border-solid [&_.rep-category-preview-grid]:tw-border-iron-900 [&_.rep-category-preview-grid]:tw-pt-8 [&_.rep-category-preview-list]:!tw-gap-0.5 [&_.rep-category-preview-row]:!tw-rounded-lg [&_.rep-category-preview-row]:!tw-border-0 [&_.rep-category-preview-row]:!tw-bg-transparent [&_.rep-category-preview-row]:tw-transition-colors hover:[&_.rep-category-preview-row]:!tw-bg-iron-900 [&_.rep-category-preview-section]:tw-px-2 [&_.rep-category-preview-title]:!tw-mb-4 [&_.rep-category-preview-title]:!tw-text-xs [&_.rep-category-preview-title]:!tw-font-semibold [&_.rep-category-preview-title]:!tw-uppercase [&_.rep-category-preview-title]:!tw-tracking-wider [&_.rep-category-preview-title]:!tw-text-iron-500 [&_.rep-category-preview-value]:!tw-font-normal [&_.rep-category-preview-value]:!tw-tracking-tight [&_.rep-category-preview-value]:!tw-text-iron-400 [&_.rep-category-profile-name]:!tw-text-iron-200 [&_.rep-category-scope-tab[aria-selected=true]]:!tw-bg-iron-800 [&_.rep-category-scope-tab[aria-selected=true]]:!tw-text-white [&_.rep-category-scope-tab]:!tw-min-h-10 [&_.rep-category-scope-tab]:!tw-rounded-lg [&_.rep-category-scope-tab]:!tw-border-transparent [&_.rep-category-scope-tab]:!tw-px-5 [&_.rep-category-scope-tab]:!tw-text-[0.8125rem] [&_.rep-category-scope-tab]:!tw-font-medium [&_.rep-category-scope-tab]:!tw-text-iron-500 [&_.rep-category-scope]:tw-w-fit [&_.rep-category-scope]:tw-max-w-full [&_.rep-category-scope]:!tw-gap-1.5 [&_.rep-category-scope]:tw-rounded-xl [&_.rep-category-scope]:tw-bg-iron-950 [&_.rep-category-scope]:tw-p-1 [&_.rep-category-scope]:tw-ring-1 [&_.rep-category-scope]:tw-ring-inset [&_.rep-category-scope]:tw-ring-iron-900 [&_.rep-category-section-tab[aria-pressed=true]]:!tw-text-white [&_.rep-category-section-tab[aria-pressed=true]]:tw-shadow-[inset_0_-2px_0_white] [&_.rep-category-section-tab[aria-selected=true]]:!tw-text-white [&_.rep-category-section-tab[aria-selected=true]]:tw-shadow-[inset_0_-2px_0_white] [&_.rep-category-section-tab]:!tw-rounded-lg [&_.rep-category-section-tab]:!tw-border-0 [&_.rep-category-section-tab]:!tw-bg-transparent [&_.rep-category-section-tab]:!tw-px-1 [&_.rep-category-section-tab]:!tw-text-[0.8125rem] [&_.rep-category-section-tab]:!tw-font-medium [&_.rep-category-section-tab]:!tw-text-iron-500 [&_.rep-category-section-tabs]:!tw-gap-5 [&_.rep-category-section-tabs]:!tw-border-0 [&_.rep-category-section-tabs]:!tw-bg-transparent [&_.rep-category-section-tabs]:!tw-px-2 [&_.rep-category-section-tabs]:!tw-pb-0 [&_.rep-category-sort-button[aria-pressed=true]]:!tw-bg-iron-800 [&_.rep-category-sort-button[aria-pressed=true]]:!tw-text-white [&_.rep-category-sort-button]:!tw-rounded-lg [&_.rep-category-sort-button]:!tw-border-transparent [&_.rep-category-sort-button]:!tw-px-4 [&_.rep-category-sort-button]:!tw-text-[0.8125rem] [&_.rep-category-sort-button]:!tw-font-medium [&_.rep-category-sort-button]:!tw-text-iron-500 [&_.rep-category-sort]:tw-rounded-xl [&_.rep-category-sort]:tw-bg-iron-950 [&_.rep-category-sort]:tw-p-1 [&_.rep-category-sort]:tw-ring-1 [&_.rep-category-sort]:tw-ring-inset [&_.rep-category-sort]:tw-ring-iron-900 [&_.rep-category-state]:!tw-rounded-xl [&_.rep-category-state]:!tw-border-iron-900 [&_.rep-category-state]:!tw-bg-iron-950 [&_.rep-category-table-frame]:!tw-rounded-xl [&_.rep-category-table-frame]:!tw-border-0 [&_.rep-category-table-frame]:!tw-bg-iron-950 [&_.rep-category-table-frame]:tw-ring-1 [&_.rep-category-table-frame]:tw-ring-inset [&_.rep-category-table-frame]:tw-ring-iron-900 [&_.rep-category-table-head]:!tw-bg-iron-900 [&_.rep-category-table-row]:tw-transition-colors hover:[&_.rep-category-table-row]:tw-bg-iron-900 [&_.rep-category-table]:!tw-bg-transparent [&_.rep-category-title]:!tw-text-3xl [&_.rep-category-title]:!tw-font-medium [&_.rep-category-title]:!tw-leading-tight [&_.rep-category-title]:!tw-tracking-tight [&_.rep-category-title]:!tw-text-iron-50 [&_.rep-category-wave-content]:!tw-gap-8 [&_.rep-category-wave-controls]:!tw-border-0 [&_.rep-category-wave-link]:!tw-text-iron-200">
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
