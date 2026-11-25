export type SidebarWaveRowLayoutVariant = "app" | "web";

interface SidebarWaveRowLayoutInput {
  readonly isChildRow: boolean;
  readonly isAnnouncement?: boolean;
  readonly isDirectMessage?: boolean;
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
const ROOT_WAVE_PADDING_CLASSES = "tw-pl-8 tw-pr-5 touch-only:tw-pl-12";
const SUBWAVE_PADDING_CLASSES = "tw-pl-[86px] tw-pr-5 touch-only:tw-pl-[102px]";
const DEFAULT_ROW_HEIGHT_CLASSES = "tw-h-full tw-min-h-[62px]";
const CHILD_ROW_HEIGHT_CLASSES = "tw-h-full tw-min-h-[48px]";
export const SIDEBAR_SUBWAVE_GUIDE_LINE_OFFSET_CLASSES =
  "tw-left-12 touch-only:tw-left-16";

export const getSidebarWaveRowTextClasses = ({
  isActive,
  hasUnread,
}: {
  readonly isActive: boolean;
  readonly hasUnread: boolean;
}): { readonly name: string; readonly weight: string } => {
  if (isActive) {
    return {
      name: "tw-text-white desktop-hover:group-hover:tw-text-white",
      weight: "tw-font-medium",
    };
  }
  if (hasUnread) {
    return {
      name: "tw-text-iron-300 desktop-hover:group-hover:tw-text-iron-300",
      weight: "tw-font-medium",
    };
  }
  return {
    name: "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300",
    weight: "tw-font-normal",
  };
};

const rowLayoutByVariant = {
  app: {
    child: {
      rowPaddingClasses: `${SUBWAVE_PADDING_CLASSES} md:tw-pl-[82px] md:touch-only:tw-pl-[98px]`,
      rowGapClasses: "tw-gap-x-2",
      linkGapClasses: "tw-space-x-2",
      rowHeightClasses: CHILD_ROW_HEIGHT_CLASSES,
      guideLineOffsetClasses: SIDEBAR_SUBWAVE_GUIDE_LINE_OFFSET_CLASSES,
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
      rowPaddingClasses: `${SUBWAVE_PADDING_CLASSES} md:tw-pl-[78px] md:touch-only:tw-pl-[94px]`,
      rowGapClasses: "tw-gap-x-2",
      linkGapClasses: "tw-space-x-2",
      rowHeightClasses: CHILD_ROW_HEIGHT_CLASSES,
      guideLineOffsetClasses: SIDEBAR_SUBWAVE_GUIDE_LINE_OFFSET_CLASSES,
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
  isAnnouncement = false,
  isDirectMessage = false,
  variant,
}: SidebarWaveRowLayoutInput): SidebarWaveRowLayoutClasses => {
  const variantLayout = rowLayoutByVariant[variant];

  if (isChildRow) {
    return variantLayout.child;
  }

  return {
    ...variantLayout.default,
    rowPaddingClasses: isDirectMessage
      ? variantLayout.default.rowPaddingClasses
      : ROOT_WAVE_PADDING_CLASSES,
    rowHeightClasses: isAnnouncement
      ? "tw-h-full tw-min-h-12"
      : variantLayout.default.rowHeightClasses,
  };
};
