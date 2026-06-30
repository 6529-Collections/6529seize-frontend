export const appWalletContainerClassName =
  "tw-mx-auto tw-w-full tw-px-3 min-[576px]:tw-max-w-[540px] min-[768px]:tw-max-w-[720px] min-[992px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1140px] min-[1400px]:tw-max-w-[1320px]";

export const appWalletRowClassName = "tw-flex tw-flex-wrap -tw-mx-3";

export const appWalletColClassName =
  "tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3";

export const appWalletCol12ClassName =
  "tw-relative tw-w-full tw-max-w-full tw-flex-none tw-px-3";

export const appWalletWalletCardColClassName =
  `${appWalletCol12ClassName} min-[576px]:tw-w-1/2 min-[768px]:tw-w-1/3`;

export const appWalletPhraseColClassName =
  "tw-relative tw-w-1/2 tw-max-w-full tw-flex-none tw-px-3 min-[576px]:tw-w-1/3 min-[768px]:tw-w-1/4";

type AppWalletButtonVariant =
  | "danger"
  | "info"
  | "outline-danger"
  | "outline-info"
  | "primary"
  | "secondary"
  | "success"
  | "warning";

const appWalletButtonBaseClassName =
  "tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-[0.375rem] tw-border tw-border-solid tw-px-3 tw-py-[0.375rem] tw-text-base tw-font-normal tw-leading-6 tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-pointer-events-none disabled:tw-cursor-default disabled:tw-opacity-[0.65]";

const appWalletButtonVariantClassNames: Record<AppWalletButtonVariant, string> =
  {
    danger:
      "tw-border-[#dc3545] tw-bg-[#dc3545] tw-text-white enabled:hover:tw-border-[#b02a37] enabled:hover:tw-bg-[#bb2d3b]",
    info: "tw-border-[#0dcaf0] tw-bg-[#0dcaf0] tw-text-black enabled:hover:tw-border-[#25cff2] enabled:hover:tw-bg-[#31d2f2]",
    "outline-danger":
      "tw-border-[#dc3545] tw-bg-transparent tw-text-[#dc3545] enabled:hover:tw-bg-[#dc3545] enabled:hover:tw-text-white",
    "outline-info":
      "tw-border-[#0dcaf0] tw-bg-transparent tw-text-[#0dcaf0] enabled:hover:tw-bg-[#0dcaf0] enabled:hover:tw-text-black",
    primary:
      "tw-border-[#0d6efd] tw-bg-[#0d6efd] tw-text-white enabled:hover:tw-border-[#0a58ca] enabled:hover:tw-bg-[#0b5ed7]",
    secondary:
      "tw-border-[#6c757d] tw-bg-[#6c757d] tw-text-white enabled:hover:tw-border-[#565e64] enabled:hover:tw-bg-[#5c636a]",
    success:
      "tw-border-[#198754] tw-bg-[#198754] tw-text-white enabled:hover:tw-border-[#146c43] enabled:hover:tw-bg-[#157347]",
    warning:
      "tw-border-[#ffc107] tw-bg-[#ffc107] tw-text-black enabled:hover:tw-border-[#ffc720] enabled:hover:tw-bg-[#ffca2c]",
  };

export function appWalletButtonClassName(
  variant: AppWalletButtonVariant,
  className = ""
): string {
  return [
    appWalletButtonBaseClassName,
    appWalletButtonVariantClassNames[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
