export function getMemesSortButtonClasses(isActive: boolean): string {
  return `tw-relative tw-m-0 tw-inline-flex tw-h-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-none tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-sm tw-font-medium tw-leading-5 tw-no-underline tw-shadow-none tw-transition-colors tw-duration-200 after:tw-absolute after:-tw-bottom-0.5 after:tw-left-0 after:tw-h-px after:tw-w-full after:tw-origin-left after:tw-transition-transform after:tw-duration-200 after:tw-content-[''] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none motion-reduce:after:tw-transition-none lg:[body:not(.capacitor-native)_&]:tw-h-7 lg:[body:not(.capacitor-native)_&]:focus-visible:tw-outline-offset-0 ${
    isActive
      ? "tw-text-white after:tw-scale-x-100 after:tw-bg-primary-400 active:tw-text-white desktop-hover:hover:tw-text-white"
      : "tw-text-iron-400 after:tw-scale-x-0 after:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:after:tw-scale-x-100"
  }`;
}
