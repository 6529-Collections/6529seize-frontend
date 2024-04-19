import { cicToType, getTimeAgo } from "../../../../../helpers/Helpers";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import DropAuthorHandle from "./DropAuthorHandle";
import { ProfileMinimal } from "../../../../../entities/IProfile";
import UserCICAndLevel from "../../../../user/utils/UserCICAndLevel";

export enum DropAuthorSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

export default function DropAuthor({
  profile,
  timestamp,
  size = DropAuthorSize.MEDIUM,
}: {
  readonly profile: ProfileMinimal;
  readonly timestamp: number;
  readonly size?: DropAuthorSize;
}) {
  const cicType = cicToType(profile.cic);

  const getTextClasses = (): string => {
    switch (size) {
      case DropAuthorSize.SMALL:
        return "tw-text-sm";
      case DropAuthorSize.MEDIUM:
        return "tw-text-md";
      default:
        assertUnreachable(size);
        return "";
    }
  };

  const textClasses = getTextClasses();
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-center">
      <UserCICAndLevel level={profile.level} cicType={cicType} />
      <DropAuthorHandle profile={profile} size={size} />

      <span className="tw-text-iron-500">&bull;</span>
      <p
        className={`${textClasses} tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500`}
      >
        {getTimeAgo(timestamp)}
      </p>
    </div>
  );
}
