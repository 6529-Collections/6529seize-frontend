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

  const pfpImg = props.pfp ? (
    <img
      src={getScaledImageUri(props.pfp, ImageScale.W_AUTO_H_50)}
      alt={props.consolidationKey}
      className="tw-h-[40px] tw-bg-transparent tw-object-contain"
    />
  ) : (
    <></>
  );

  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <a
        href={`/${link}`}
        className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-iron-100 tw-no-underline hover:tw-text-white hover:tw-no-underline"
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
