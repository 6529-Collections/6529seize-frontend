export function getCollectionSortButtonClasses(isActive: boolean): string {
  return `tw-relative tw-m-0 tw-shrink-0 tw-cursor-pointer tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-sm tw-font-medium tw-leading-5 tw-no-underline tw-transition-colors tw-duration-200 after:tw-absolute after:-tw-bottom-0.5 after:tw-left-0 after:tw-h-px after:tw-w-full after:tw-origin-left after:tw-transition-transform after:tw-duration-200 after:tw-content-[''] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-shrink ${
    isActive
      ? "tw-text-white after:tw-scale-x-100 after:tw-bg-primary-400"
      : "tw-text-iron-500 after:tw-scale-x-0 after:tw-bg-iron-700 hover:tw-text-iron-200 hover:after:tw-scale-x-100"
  }`;
}
