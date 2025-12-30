import { getTimeAgoShort } from "@/helpers/Helpers";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import DropAuthorHandle from "./DropAuthorHandle";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { DropPartSize } from "@/components/drops/view/part/DropPart.types";
import { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";

interface DropAuthorProps {
  readonly profile: ProfileMinWithoutSubs;
  readonly timestamp: number;
  readonly size?: DropPartSize;
  readonly children?: React.ReactNode;
}

export default function DropAuthor({
  profile,
  timestamp,
  size = DropPartSize.MEDIUM,
  children,
}: DropAuthorProps) {
  const getTextClasses = (): string => {
    switch (size) {
      case DropPartSize.SMALL:
        return "tw-text-sm";
      case DropPartSize.MEDIUM:
      case DropPartSize.LARGE:
        return "tw-text-md";
      default:
        assertUnreachable(size);
        return "";
    }
  };

  const textClasses = getTextClasses();
  return (
    <div className="tw-flex tw-items-center tw-w-full tw-gap-x-2">
      <div className="tw-flex tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-center">
          <UserCICAndLevel
            level={profile.level}
            size={UserCICAndLevelSize.SMALL}
          />
          <DropAuthorHandle profile={profile} size={size} />
        </div>
        {children}
      </div>
      <p
        className={`${textClasses} tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500`}
      >
        {getTimeAgoShort(timestamp)}
      </p>
    </div>
  );
}
