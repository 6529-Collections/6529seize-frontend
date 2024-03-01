const LEVEL_CLASSES: { minLevel: number; classes: string }[] = [
  { minLevel: 0, classes: "tw-text-[#DA8C60] tw-ring-[#DA8C60]" },
  { minLevel: 20, classes: "tw-text-[#DAAC60] tw-ring-[#DAAC60]" },
  { minLevel: 40, classes: "tw-text-[#DAC660] tw-ring-[#DAC660]" },
  { minLevel: 60, classes: "tw-text-[#AABE68] tw-ring-[#AABE68]" },
  { minLevel: 80, classes: "tw-text-[#55B075] tw-ring-[#55B075]" },
].reverse();

export default function UserLevel({
  level,
  size = "base",
}: {
  level: number;
  size?: "sm" | "base";
}) {
  const getColorClasses = () =>
    LEVEL_CLASSES.find((levelClass) => levelClass.minLevel <= level)?.classes ??
    LEVEL_CLASSES[0].classes;

  const getSizeClasses = () => (size === "sm" ? "tw-text-sm" : "tw-text-base");
  const classes = `${getColorClasses()} ${getSizeClasses()}`;
  const openLevelsPage = () => {
    window.open("/levels", "_blank");
  };

  return (
    <div className="tw-mt-2">
      <span
        onClick={openLevelsPage}
        className={`tw-cursor-pointer tw-inline-flex tw-items-center tw-rounded-xl tw-bg-transparent tw-px-2 tw-py-1 tw-font-semibold tw-ring-2 tw-ring-inset ${classes}`}
      >
        Level {level}
      </span>
    </div>
  );
}
