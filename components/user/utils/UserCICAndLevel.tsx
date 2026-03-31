export enum UserCICAndLevelSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  XLARGE = "XLARGE",
}

const LEVEL_COLORS = [
  {
    minLevel: 80,
    classes: "tw-text-[#55B075] tw-border-[#55B075] tw-bg-[#55B075]/10",
  },
  {
    minLevel: 60,
    classes: "tw-text-[#AABE68] tw-border-[#AABE68] tw-bg-[#AABE68]/10",
  },
  {
    minLevel: 40,
    classes: "tw-text-[#DAC660] tw-border-[#DAC660] tw-bg-[#DAC660]/10",
  },
  {
    minLevel: 20,
    classes: "tw-text-[#DAAC60] tw-border-[#DAAC60] tw-bg-[#DAAC60]/10",
  },
  {
    minLevel: 0,
    classes: "tw-text-[#DA8C60] tw-border-[#DA8C60] tw-bg-[#DA8C60]/10",
  },
];

const getLevelColorClasses = (level: number): string => {
  const found = LEVEL_COLORS.find((l) => l.minLevel <= level);
  return found
    ? found.classes
    : "tw-text-[#DA8C60] tw-border-[#DA8C60] tw-bg-[#DA8C60]/10";
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
    [UserCICAndLevelSize.SMALL]: "tw-h-5 tw-w-5 tw-text-[8.5px]",
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
        className={`${LEVEL_SIZE_CLASSES[size]} tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-font-bold tw-leading-none ${colorClasses}`}
      >
        <span className="tw-absolute tw-left-1/2 tw-top-1/2 tw-inline-flex -tw-translate-x-1/2 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-leading-none">
          {level}
        </span>
      </div>
    </div>
  );
}
