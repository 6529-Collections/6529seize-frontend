import { formatAddress } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
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
    <div className="d-flex align-items-center gap-3">
      <a
        href={`/${link}`}
        className="no-wrap d-flex gap-2 decoration-none align-items-center"
      >
        {pfpImg}
        {hasLevel ? (
          <div
            className={`d-flex gap-2 align-items-center ${styles["collectorLevel"]}`}
          >
            <UserCICAndLevel
              level={props.level}
              size={UserCICAndLevelSize.LARGE}
            />
            <div>{display}</div>
          </div>
        ) : (
          <div>{display}</div>
        )}
      </a>
    </div>
  );
}
