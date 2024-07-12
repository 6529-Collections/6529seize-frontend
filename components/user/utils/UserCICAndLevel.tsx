import { CICType } from "../../../entities/IProfile";
import { CIC_COLOR } from "./raters-table/ProfileRatersTableItem";

export default function UserCICAndLevel({
  level,
  cicType,
  color,
  size = "sm",
}: {
  readonly level: number;
  readonly cicType: CICType;
  readonly color?: string;
  size?: "sm" | "lg";
}) {
  const mainColor = color ?? "iron-300";
  const sizeClasses =
    size === "sm" ? "tw-h-5 tw-w-5 tw-ring-2" : "tw-h-8 tw-w-8 tw-ring-4";
  return (
    <div className="tw-relative">
      <div
        className={`tw-flex tw-items-center tw-justify-center ${sizeClasses} tw-text-[0.625rem] tw-leading-3 tw-font-bold tw-rounded-full tw-ring-${mainColor} tw-text-${mainColor}`}>
        {level}
      </div>
      <span
        className={`tw-flex-shrink-0 tw-absolute -tw-right-1 -tw-top-1 tw-block tw-h-2.5 tw-w-2.5 tw-rounded-full ${CIC_COLOR[cicType]}`}></span>
    </div>
  );
}
