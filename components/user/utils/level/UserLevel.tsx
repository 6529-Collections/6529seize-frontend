const LEVEL_CLASSES: { minLevel: number; classes: string }[] = [
  { minLevel: 80, classes: "tw-text-[#55B075] tw-ring-[#55B075]" },
  { minLevel: 60, classes: "tw-text-[#AABE68] tw-ring-[#AABE68]" },
  { minLevel: 40, classes: "tw-text-[#DAC660] tw-ring-[#DAC660]" },
  { minLevel: 20, classes: "tw-text-[#DAAC60] tw-ring-[#DAAC60]" },
  { minLevel: 0, classes: "tw-text-[#DA8C60] tw-ring-[#DA8C60]" },
] as const;

export default function UserLevel({
  level,
  size = "base",
  asSpan = false,
  showLabel = true,
}: {
  readonly level: number;
  readonly size?: "xxs" | "xs" | "sm" | "base" | undefined;
  readonly asSpan?: boolean | undefined;
  readonly showLabel?: boolean | undefined;
}) {
  const getColorClasses = () =>
    LEVEL_CLASSES.find((levelClass) => levelClass.minLevel <= level)?.classes ??
    LEVEL_CLASSES.at(0)!.classes;

  const getSizeClasses = () => {
    if (size === "sm") {
      return "tw-text-sm tw-font-semibold tw-ring-1 tw-py-1";
    }
    if (size === "xs") {
      return "tw-text-[0.6875rem] tw-ring-1 tw-font-semibold tw-py-[0.1875rem]";
    }
    if (size === "xxs") {
      return "tw-text-[0.6875rem] tw-ring-1 tw-font-semibold tw-py-0";
    }
    return "tw-text-base tw-font-semibold tw-ring-1 tw-py-1";
  };

  const classes = `${getColorClasses()} ${getSizeClasses()}`;
  const openLevelsPage = () => {
    window.open("/network/levels", "_blank");
  };

  const content = showLabel ? `Level ${level}` : `${level}`;
  const sharedClasses = `tw-inline-flex tw-items-center tw-justify-center ${showLabel ? "tw-rounded-xl tw-px-2" : "tw-rounded-full tw-min-w-[2rem]"} tw-ring-inset ${classes}`;

  if (asSpan) {
    return <span className={sharedClasses}>{content}</span>;
  }

  return (
    <button
      onClick={openLevelsPage}
      className={`tw-border-none tw-bg-transparent ${sharedClasses}`}
    >
      {content}
    </button>
  );
}
