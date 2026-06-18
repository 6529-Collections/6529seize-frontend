type SidebarWaveRowLayoutVariant = "app" | "web";

interface SidebarWaveRowLayoutInput {
  readonly isChildRow: boolean;
  readonly variant: SidebarWaveRowLayoutVariant;
}

interface SidebarWaveRowLayoutClasses {
  readonly rowPaddingClasses: string;
  readonly rowGapClasses: string;
  readonly linkGapClasses: string;
}

const DEFAULT_LINK_GAP_CLASSES = "tw-space-x-3";

const rowLayoutByVariant = {
  app: {
    child: {
      rowPaddingClasses: "tw-pl-[84px] tw-pr-5 md:tw-pl-20",
      rowGapClasses: "tw-gap-x-2",
      linkGapClasses: "tw-space-x-2",
    },
    default: {
      rowPaddingClasses: "tw-px-5",
      rowGapClasses: "tw-gap-x-4",
      linkGapClasses: DEFAULT_LINK_GAP_CLASSES,
    },
  },
  web: {
    child: {
      rowPaddingClasses: "tw-pl-[84px] tw-pr-5 md:tw-pl-[72px]",
      rowGapClasses: "tw-gap-x-2",
      linkGapClasses: "tw-space-x-2",
    },
    default: {
      rowPaddingClasses: "tw-px-5",
      rowGapClasses: "tw-gap-x-4",
      linkGapClasses: DEFAULT_LINK_GAP_CLASSES,
    },
  },
} as const satisfies Record<
  SidebarWaveRowLayoutVariant,
  Record<"child" | "default", SidebarWaveRowLayoutClasses>
>;

export const getSidebarWaveRowLayoutClasses = ({
  isChildRow,
  variant,
}: SidebarWaveRowLayoutInput): SidebarWaveRowLayoutClasses => {
  const variantLayout = rowLayoutByVariant[variant];

  if (isChildRow) {
    return variantLayout.child;
  }

  return variantLayout.default;
};
