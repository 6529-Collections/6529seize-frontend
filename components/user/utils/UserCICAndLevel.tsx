export enum UserCICAndLevelSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  XLARGE = "XLARGE",
}

export default function UserCICAndLevel({
  level,
  color,
  size = UserCICAndLevelSize.MEDIUM,
}: {
  readonly level: number;
  readonly color?: string;
  readonly size?: UserCICAndLevelSize;
}) {
  const mainColor = color ?? "iron-300";

  const LEVEL_SIZE_CLASSES: Record<UserCICAndLevelSize, string> = {
    [UserCICAndLevelSize.SMALL]: "tw-h-5 tw-w-5 tw-text-[9px]",
    [UserCICAndLevelSize.MEDIUM]: "tw-h-6 tw-w-6 tw-text-[0.65rem]",
    [UserCICAndLevelSize.LARGE]: "tw-h-8 tw-w-8 tw-text-[0.8rem]",
    [UserCICAndLevelSize.XLARGE]: "tw-h-10 tw-w-10 tw-text-[1rem]",
  };

  return (
    <div className="tw-inline-flex">
      <div
        className={`${LEVEL_SIZE_CLASSES[size]} tw-flex tw-items-center tw-justify-center tw-font-bold tw-rounded-full
        tw-bg-iron-800 tw-leading-none
        tw-border tw-border-solid tw-border-iron-700
        tw-text-${mainColor}`}>
        <span>{level}</span>
      </div>
    </div>
  );
}
