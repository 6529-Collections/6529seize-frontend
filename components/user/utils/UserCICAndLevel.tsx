export enum UserCICAndLevelSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  XLARGE = "XLARGE",
}

const LEVEL_COLORS = [
  { minLevel: 80, classes: "tw-text-[#55B075] tw-border-[#55B075]" },
  { minLevel: 60, classes: "tw-text-[#AABE68] tw-border-[#AABE68]" },
  { minLevel: 40, classes: "tw-text-[#DAC660] tw-border-[#DAC660]" },
  { minLevel: 20, classes: "tw-text-[#DAAC60] tw-border-[#DAAC60]" },
  { minLevel: 0, classes: "tw-text-[#DA8C60] tw-border-[#DA8C60]" },
];

const getLevelColorClasses = (level: number): string => {
  const found = LEVEL_COLORS.find((l) => l.minLevel <= level);
  return found ? found.classes : "tw-text-[#DA8C60] tw-border-[#DA8C60]";
};

export default function UserCICAndLevel({
  level,
  color,
  size = UserCICAndLevelSize.MEDIUM,
}: {
  readonly level: number;
  readonly color?: string | undefined;
  readonly size?: UserCICAndLevelSize | undefined;
}) {
  const LEVEL_SIZE_CLASSES: Record<UserCICAndLevelSize, string> = {
    [UserCICAndLevelSize.SMALL]: "tw-h-5 tw-w-5 tw-text-[9px]",
    [UserCICAndLevelSize.MEDIUM]: "tw-h-6 tw-w-6 tw-text-[0.65rem]",
    [UserCICAndLevelSize.LARGE]: "tw-h-8 tw-w-8 tw-text-[0.8rem]",
    [UserCICAndLevelSize.XLARGE]: "tw-h-10 tw-w-10 tw-text-[1rem]",
  };

  const colorClasses = color
    ? `tw-text-${color} tw-border-iron-700`
    : getLevelColorClasses(level);

  return (
    <div className="tw-inline-flex">
      <div
        className={`${LEVEL_SIZE_CLASSES[size]} tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-iron-800 tw-font-bold tw-leading-none ${colorClasses}`}
      >
        <span>{level}</span>
      </div>
    </div>
  );
}
