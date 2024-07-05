import { cicToType, getTimeAgo } from "../../../../../helpers/Helpers";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import DropAuthorHandle from "./DropAuthorHandle";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../../user/utils/UserCICAndLevel";
import { ProfileMin } from "../../../../../generated/models/ProfileMin";

export enum DropAuthorSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

export default function DropAuthor({
  profile,
  timestamp,
  size = DropAuthorSize.MEDIUM,
}: {
  readonly profile: ProfileMin;
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
    <div className="tw-flex tw-items-center tw-gap-x-4">
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-center">
        <DropAuthorHandle profile={profile} size={size} />
        <UserCICAndLevel
          level={profile.level}
          cicType={cicType}
          size={UserCICAndLevelSize.SMALL}
        />
      </div>
      <p
        className={`${textClasses} tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500`}
      >
        {getTimeAgo(timestamp)}
      </p>
    </div>
  );
}
