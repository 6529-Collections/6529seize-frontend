import { CICType } from "@/entities/IProfile";
import { CIC_COLOR } from "@/components/user/utils/raters-table/ProfileRatersTableItem";

export enum ProfileLevelSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  XLARGE = "XLARGE",
}

interface ProfileLevelProps {
  readonly level: number;
  readonly cicType: CICType;
  readonly color?: string;
  readonly size?: ProfileLevelSize;
}

const LEVEL_SIZE_CLASSES: Record<ProfileLevelSize, string> = {
  [ProfileLevelSize.SMALL]: "tw-h-4 tw-w-4 tw-text-[9px]",
  [ProfileLevelSize.MEDIUM]: "tw-h-5 tw-w-5 tw-text-[0.625rem]",
  [ProfileLevelSize.LARGE]: "tw-h-6 tw-w-6 tw-text-[0.75rem]",
  [ProfileLevelSize.XLARGE]: "tw-h-8 tw-w-8 tw-text-[1rem]",
};

const CIC_SIZE_CLASSES: Record<ProfileLevelSize, string> = {
  [ProfileLevelSize.SMALL]: "-tw-top-[0.1875rem] tw-h-2 tw-w-2",
  [ProfileLevelSize.MEDIUM]: "-tw-top-1 tw-h-2 tw-w-2",
  [ProfileLevelSize.LARGE]: "-tw-top-1.5 tw-h-3 tw-w-3",
  [ProfileLevelSize.XLARGE]: "-tw-top-2 tw-h-4 tw-w-4",
};

export default function ProfileLevel({
  level,
  cicType,
  color,
  size = ProfileLevelSize.MEDIUM,
}: ProfileLevelProps) {
  const mainColor = color ?? "iron-300";

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

export { ProfileLevelSize as UserCICAndLevelSize };
