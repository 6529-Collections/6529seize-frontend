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
      headerCloseButtonClassName="!tw-mr-0 !tw-h-8 !tw-w-8 !tw-rounded-md !tw-bg-transparent !tw-p-0 !tw-text-iron-500 !tw-ring-0 hover:!tw-bg-iron-900 hover:!tw-text-white focus:!tw-ring-0 focus-visible:!tw-ring-2 focus-visible:!tw-ring-primary-400/60 [&_svg]:!tw-h-5 [&_svg]:!tw-w-5"
    >
      <div
        className={`
          tw-px-6 sm:tw-px-10
          [&_.rep-category-eyebrow]:!tw-mb-1 [&_.rep-category-eyebrow]:!tw-mt-0 [&_.rep-category-eyebrow]:!tw-text-xs [&_.rep-category-eyebrow]:!tw-font-semibold [&_.rep-category-eyebrow]:!tw-uppercase [&_.rep-category-eyebrow]:!tw-tracking-wider [&_.rep-category-eyebrow]:!tw-text-iron-500
          [&_.rep-category-full-page]:!tw-h-10 [&_.rep-category-full-page]:!tw-rounded-lg [&_.rep-category-full-page]:!tw-border-iron-800 [&_.rep-category-full-page]:!tw-bg-iron-950 [&_.rep-category-full-page]:!tw-px-3 [&_.rep-category-full-page]:!tw-py-0 [&_.rep-category-full-page]:!tw-text-xs [&_.rep-category-full-page]:!tw-font-medium [&_.rep-category-full-page]:!tw-text-iron-300 hover:[&_.rep-category-full-page]:!tw-bg-iron-900 hover:[&_.rep-category-full-page]:!tw-text-white
          [&_.rep-category-header]:tw-pr-14 sm:[&_.rep-category-header]:tw-pr-16 [&_.rep-category-header-actions]:tw-items-center [&_.rep-category-layout]:!tw-gap-6
          [&_.rep-category-load-more]:!tw-rounded-lg [&_.rep-category-load-more]:!tw-border-iron-800 [&_.rep-category-load-more]:!tw-bg-iron-950 [&_.rep-category-load-more]:!tw-px-5 hover:[&_.rep-category-load-more]:!tw-bg-iron-900
          [&_.rep-category-metric-label]:!tw-mb-1 [&_.rep-category-metric-label]:!tw-mt-0 [&_.rep-category-metric-label]:!tw-whitespace-nowrap [&_.rep-category-metric-label]:!tw-text-xs [&_.rep-category-metric-label]:!tw-font-semibold [&_.rep-category-metric-label]:!tw-uppercase [&_.rep-category-metric-label]:!tw-tracking-wider [&_.rep-category-metric-label]:!tw-text-iron-500
          [&_.rep-category-metric-value]:!tw-mt-0 [&_.rep-category-metric-value]:!tw-whitespace-nowrap [&_.rep-category-metric-value]:!tw-text-sm [&_.rep-category-metric-value]:!tw-font-normal [&_.rep-category-metric-value]:!tw-leading-tight [&_.rep-category-metric-value]:!tw-tracking-tight [&_.rep-category-metric-value]:!tw-text-iron-200 sm:[&_.rep-category-metric-value]:!tw-text-lg lg:[&_.rep-category-metric-value]:!tw-text-2xl
          [&_.rep-category-metric:first-child_.rep-category-metric-value]:!tw-font-semibold [&_.rep-category-metric:first-child_.rep-category-metric-value]:!tw-text-iron-50
          [&_.rep-category-metric]:!tw-min-w-0 [&_.rep-category-metric]:!tw-rounded-lg [&_.rep-category-metric]:!tw-border-0 [&_.rep-category-metric]:!tw-bg-transparent [&_.rep-category-metric]:!tw-px-0 [&_.rep-category-metric]:!tw-py-0 sm:[&_.rep-category-metric]:!tw-px-1 lg:[&_.rep-category-metric]:!tw-px-2
          [&_.rep-category-metrics]:!tw-grid-cols-2 [&_.rep-category-metrics]:!tw-gap-x-2 [&_.rep-category-metrics]:!tw-gap-y-4 sm:[&_.rep-category-metrics]:!tw-grid-cols-4 sm:[&_.rep-category-metrics]:!tw-gap-x-4 lg:[&_.rep-category-metrics]:!tw-gap-x-6 [&_.rep-category-overview]:!tw-gap-6
          [&_.rep-category-preview-grid]:!tw-gap-x-8 [&_.rep-category-preview-grid]:!tw-gap-y-8 [&_.rep-category-preview-grid]:tw-border-b-0 [&_.rep-category-preview-grid]:tw-border-l-0 [&_.rep-category-preview-grid]:tw-border-r-0 [&_.rep-category-preview-grid]:tw-border-t [&_.rep-category-preview-grid]:tw-border-solid [&_.rep-category-preview-grid]:tw-border-iron-900 [&_.rep-category-preview-grid]:tw-pt-6
          [&_.rep-category-preview-list]:!tw-gap-0.5 [&_.rep-category-preview-row]:!tw-rounded-lg [&_.rep-category-preview-row]:!tw-border-0 [&_.rep-category-preview-row]:!tw-bg-transparent [&_.rep-category-preview-row]:tw-transition-colors hover:[&_.rep-category-preview-row]:!tw-bg-iron-900
          [&_.rep-category-activity-row]:!tw-rounded-none [&_.rep-category-activity-row]:!tw-border-x-0 [&_.rep-category-activity-row]:!tw-border-b [&_.rep-category-activity-row]:!tw-border-t-0 [&_.rep-category-activity-row]:!tw-border-solid [&_.rep-category-activity-row]:!tw-border-white/5 [&_.rep-category-activity-row]:!tw-bg-transparent [&_.rep-category-activity-row]:!tw-px-0 [&_.rep-category-activity-row]:!tw-py-3 [&_.rep-category-activity-row:last-child]:!tw-border-b-0
          [&_.rep-category-preview-section]:tw-px-0 sm:[&_.rep-category-preview-section]:tw-px-1 lg:[&_.rep-category-preview-section]:tw-px-2 [&_.rep-category-preview-title]:!tw-mb-3 [&_.rep-category-preview-title]:!tw-mt-0 [&_.rep-category-preview-title]:!tw-text-xs [&_.rep-category-preview-title]:!tw-font-semibold [&_.rep-category-preview-title]:!tw-uppercase [&_.rep-category-preview-title]:!tw-tracking-wider [&_.rep-category-preview-title]:!tw-text-iron-500
          [&_.rep-category-preview-value]:!tw-font-normal [&_.rep-category-preview-value]:!tw-tracking-tight [&_.rep-category-preview-value]:!tw-text-iron-400 [&_.rep-category-profile-name]:!tw-text-iron-200
          md:[&_.rep-category-activity-grid]:!tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem] md:[&_.rep-category-activity-grid]:!tw-items-center md:[&_.rep-category-activity-grid]:!tw-gap-4 md:[&_.rep-category-activity-grid_.rep-category-preview-value]:!tw-text-right
          [&_.rep-category-scope]:tw-w-fit [&_.rep-category-scope]:tw-max-w-full
          [&_.rep-category-section-tab]:!tw-rounded-none [&_.rep-category-section-tab]:!tw-border-x-0 [&_.rep-category-section-tab]:!tw-border-b-2 [&_.rep-category-section-tab]:!tw-border-t-0 [&_.rep-category-section-tab]:!tw-border-solid [&_.rep-category-section-tab]:!tw-border-transparent [&_.rep-category-section-tab]:!tw-bg-transparent [&_.rep-category-section-tab]:!tw-px-3 [&_.rep-category-section-tab]:!tw-py-3 [&_.rep-category-section-tab]:!tw-text-sm [&_.rep-category-section-tab]:!tw-font-medium [&_.rep-category-section-tab]:!tw-text-iron-500
          [&_.rep-category-section-tab[aria-pressed=true]]:!tw-border-primary-300 [&_.rep-category-section-tab[aria-pressed=true]]:!tw-bg-transparent [&_.rep-category-section-tab[aria-pressed=true]]:!tw-text-white [&_.rep-category-section-tab[aria-pressed=true]]:!tw-shadow-none
          [&_.rep-category-section-tab[aria-selected=true]]:!tw-border-primary-300 [&_.rep-category-section-tab[aria-selected=true]]:!tw-bg-transparent [&_.rep-category-section-tab[aria-selected=true]]:!tw-text-white [&_.rep-category-section-tab[aria-selected=true]]:!tw-shadow-none hover:[&_.rep-category-section-tab]:!tw-text-iron-200
          [&_.rep-category-section-tabs]:!tw-gap-x-1 [&_.rep-category-section-tabs]:!tw-border-b [&_.rep-category-section-tabs]:!tw-border-iron-800 [&_.rep-category-section-tabs]:!tw-bg-transparent [&_.rep-category-section-tabs]:!tw-px-0 [&_.rep-category-section-tabs]:!tw-pb-0
          [&_.rep-category-sort-button[aria-pressed=true]]:!tw-bg-iron-800 [&_.rep-category-sort-button[aria-pressed=true]]:!tw-text-white [&_.rep-category-sort-button]:!tw-rounded-lg [&_.rep-category-sort-button]:!tw-border-transparent [&_.rep-category-sort-button]:!tw-px-4 [&_.rep-category-sort-button]:!tw-text-[0.8125rem] [&_.rep-category-sort-button]:!tw-font-medium [&_.rep-category-sort-button]:!tw-text-iron-500
          [&_.rep-category-sort]:tw-rounded-xl [&_.rep-category-sort]:tw-bg-iron-950 [&_.rep-category-sort]:tw-p-1 [&_.rep-category-sort]:tw-ring-1 [&_.rep-category-sort]:tw-ring-inset [&_.rep-category-sort]:tw-ring-iron-900
          [&_.rep-category-state]:!tw-rounded-xl [&_.rep-category-state]:!tw-border-iron-900 [&_.rep-category-state]:!tw-bg-iron-950
          [&_.rep-category-table-frame]:!tw-rounded-xl [&_.rep-category-table-frame]:!tw-border-0 [&_.rep-category-table-frame]:!tw-bg-iron-950 [&_.rep-category-table-frame]:tw-ring-1 [&_.rep-category-table-frame]:tw-ring-inset [&_.rep-category-table-frame]:tw-ring-iron-900
          [&_.rep-category-table-head]:!tw-bg-iron-900 [&_.rep-category-table-row]:tw-transition-colors hover:[&_.rep-category-table-row]:tw-bg-iron-900 [&_.rep-category-table]:!tw-bg-transparent
          [&_.rep-category-title]:!tw-mt-0 [&_.rep-category-title]:!tw-text-2xl [&_.rep-category-title]:!tw-font-medium [&_.rep-category-title]:!tw-leading-tight [&_.rep-category-title]:!tw-tracking-tight [&_.rep-category-title]:!tw-text-iron-50
          [&_.rep-category-wave-content]:!tw-gap-6 [&_.rep-category-wave-controls]:!tw-border-0 [&_.rep-category-wave-link]:!tw-text-iron-200
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
