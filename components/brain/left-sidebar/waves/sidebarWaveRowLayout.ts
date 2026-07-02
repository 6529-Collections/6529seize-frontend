type SidebarWaveRowLayoutVariant = "app" | "web";

interface SidebarWaveRowLayoutInput {
  readonly isChildRow: boolean;
  readonly variant: SidebarWaveRowLayoutVariant;
}

interface SidebarWaveRowLayoutClasses {
  readonly rowPaddingClasses: string;
  readonly rowGapClasses: string;
  readonly linkGapClasses: string;
  readonly rowHeightClasses: string;
  readonly guideLineOffsetClasses: string;
}

const DEFAULT_LINK_GAP_CLASSES = "tw-space-x-3";
const DEFAULT_ROW_HEIGHT_CLASSES = "tw-h-full tw-min-h-[62px]";
const CHILD_ROW_HEIGHT_CLASSES = "tw-h-full tw-min-h-[48px]";
const CHILD_GUIDE_LINE_OFFSET_CLASSES = "tw-left-9";

const rowLayoutByVariant = {
  app: {
    child: {
      rowPaddingClasses: "tw-pl-[74px] tw-pr-5 md:tw-pl-[70px]",
      rowGapClasses: "tw-gap-x-2",
      linkGapClasses: "tw-space-x-2",
      rowHeightClasses: CHILD_ROW_HEIGHT_CLASSES,
      guideLineOffsetClasses: CHILD_GUIDE_LINE_OFFSET_CLASSES,
    },
    default: {
      rowPaddingClasses: "tw-px-5",
      rowGapClasses: "tw-gap-x-4",
      linkGapClasses: DEFAULT_LINK_GAP_CLASSES,
      rowHeightClasses: DEFAULT_ROW_HEIGHT_CLASSES,
      guideLineOffsetClasses: "",
    },
  },
  web: {
    child: {
      rowPaddingClasses: "tw-pl-[74px] tw-pr-5 md:tw-pl-[66px]",
      rowGapClasses: "tw-gap-x-2",
      linkGapClasses: "tw-space-x-2",
      rowHeightClasses: CHILD_ROW_HEIGHT_CLASSES,
      guideLineOffsetClasses: CHILD_GUIDE_LINE_OFFSET_CLASSES,
    },
    default: {
      rowPaddingClasses: "tw-px-5",
      rowGapClasses: "tw-gap-x-4",
      linkGapClasses: DEFAULT_LINK_GAP_CLASSES,
      rowHeightClasses: DEFAULT_ROW_HEIGHT_CLASSES,
      guideLineOffsetClasses: "",
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
