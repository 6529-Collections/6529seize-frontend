import { formatAddress } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";

export function LeaderboardCollector(
  props: Readonly<{
    handle: string;
    consolidationKey: string;
    consolidationDisplay: string;
    pfp: string;
    level: number;
  }>
) {
  const hasLevel = props.level !== undefined && props.level !== null;
  const link = props.handle ?? props.consolidationKey.split("-")[0];
  let display =
    props.handle ??
    props.consolidationDisplay ??
    formatAddress(props.consolidationKey);
  if (display.length > 25) {
    display = display.substring(0, 25) + "...";
  }

  const pfpImg = (
    <div className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800">
      {props.pfp && (
        <img
          src={getScaledImageUri(props.pfp, ImageScale.W_AUTO_H_50)}
          alt={props.consolidationKey}
          className="tw-h-full tw-w-full tw-bg-transparent tw-object-contain"
        />
      )}
    </div>
  );

  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <a
        href={`/${link}`}
        className="tw-flex tw-items-center tw-gap-3 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400 desktop-hover:hover:tw-no-underline"
      >
        {pfpImg}
        {hasLevel ? (
          <div className="tw-flex tw-items-center tw-gap-2">
            <span>{display}</span>
            <UserCICAndLevel
              level={props.level}
              size={UserCICAndLevelSize.SMALL}
            />
          </div>
        ) : (
          <span>{display}</span>
        )}
      </a>
    </div>
  );
}
