import { CICType } from "@/entities/IProfile";
import { CIC_COLOR } from "./raters-table/ProfileRatersTableItem";

export enum UserCICAndLevelSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  XLARGE = "XLARGE",
}

export default function UserCICAndLevel({
  level,
  cicType,
  color,
  size = UserCICAndLevelSize.MEDIUM,
}: {
  readonly level: number;
  readonly cicType: CICType;
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

  const CIC_SIZE_CLASSES: Record<UserCICAndLevelSize, string> = {
    [UserCICAndLevelSize.SMALL]: "-tw-top-0.5 -tw-right-0.5 tw-h-2 tw-w-2",
    [UserCICAndLevelSize.MEDIUM]: "-tw-top-1 -tw-right-0.5 tw-h-2.5 tw-w-2.5",
    [UserCICAndLevelSize.LARGE]: "-tw-top-0.5 -tw-right-0.5 tw-h-3.5 tw-w-3.5",
    [UserCICAndLevelSize.XLARGE]: "-tw-top-0.5 -tw-right-0.5 tw-h-4 tw-w-4",
  };

  return (
    <div className="tw-relative tw-inline-flex">
      <div
        className={`${LEVEL_SIZE_CLASSES[size]} tw-flex tw-items-center tw-justify-center tw-font-bold tw-rounded-full
        tw-bg-iron-800 tw-leading-none
        tw-border tw-border-solid tw-border-iron-700
        tw-text-${mainColor}`}>
        <span>{level}</span>
      </div>
      <span
        className={`${CIC_SIZE_CLASSES[size]} ${CIC_COLOR[cicType]}
        tw-flex-shrink-0 tw-absolute tw-block tw-rounded-full
        tw-ring-2 tw-ring-[#050505] tw-shadow-sm`}></span>
    </div>
  );
}
