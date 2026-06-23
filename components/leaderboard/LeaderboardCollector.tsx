import { formatAddress } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import Image from "next/image";
import styles from "./Leaderboard.module.scss";

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
  const collectorName =
    props.handle ??
    props.consolidationDisplay ??
    formatAddress(props.consolidationKey);
  let display = collectorName;
  if (display.length > 25) {
    display = display.substring(0, 25) + "...";
  }

  const pfpImg = (
    <div className="tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 md:tw-h-10 md:tw-w-10">
      {/* Collector profile images can come from arbitrary remote hosts. */}
      {props.pfp && (
        <Image
          src={getScaledImageUri(props.pfp, ImageScale.W_AUTO_H_50)}
          alt={`${collectorName} profile picture`}
          width={40}
          height={40}
          unoptimized
          className="tw-h-full tw-w-full tw-bg-transparent tw-object-contain"
        />
      )}
    </div>
  );

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center">
      <a
        href={`/${link}`}
        className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-100 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400 desktop-hover:hover:tw-no-underline md:tw-gap-3 md:tw-text-sm"
      >
        {pfpImg}
        {hasLevel ? (
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5 md:tw-gap-2">
            <span className="tw-min-w-0 tw-truncate">{display}</span>
            <div className={styles["collectorLevel"]}>
              <UserCICAndLevel
                level={props.level}
                size={UserCICAndLevelSize.SMALL}
              />
            </div>
          </div>
        ) : (
          <span className="tw-min-w-0 tw-truncate">{display}</span>
        )}
      </a>
    </div>
  );
}
