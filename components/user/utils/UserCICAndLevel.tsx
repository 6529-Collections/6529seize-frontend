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
    [UserCICAndLevelSize.SMALL]: "tw-h-4 tw-w-4 tw-text-[9px]",
    [UserCICAndLevelSize.MEDIUM]: "tw-h-5 tw-w-5 tw-text-[0.625rem]",
    [UserCICAndLevelSize.LARGE]: "tw-h-6 tw-w-6 tw-text-[0.75rem]",
    [UserCICAndLevelSize.XLARGE]: "tw-h-8 tw-w-8 tw-text-[1rem]",
  };
  const CIC_SIZE_CLASSES: Record<UserCICAndLevelSize, string> = {
    [UserCICAndLevelSize.SMALL]: "-tw-top-[0.1875rem] tw-h-2 tw-w-2",
    [UserCICAndLevelSize.MEDIUM]: "-tw-top-1 tw-h-2 tw-w-2",
    [UserCICAndLevelSize.LARGE]: "-tw-top-1.5 tw-h-3 tw-w-3",
    [UserCICAndLevelSize.XLARGE]: "-tw-top-2 tw-h-4 tw-w-4",
  };
  return (
    <div className="tw-relative">
      <div
        className={`${LEVEL_SIZE_CLASSES[size]} tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-900 tw-ring-1 tw-ring-iron-700 tw-ring-inset tw-text-${mainColor}`}>
        {level}
      </div>
      <span
        className={`${CIC_SIZE_CLASSES[size]} ${CIC_COLOR[cicType]} tw-flex-shrink-0 tw-absolute -tw-right-1 tw-block tw-rounded-full`}></span>
    </div>
  );
}
