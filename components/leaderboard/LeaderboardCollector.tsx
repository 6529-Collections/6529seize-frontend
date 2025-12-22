import { formatAddress } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import UserCICAndLevel from "../user/utils/UserCICAndLevel";

export function LeaderboardCollector(
  props: Readonly<{
    handle: string;
    consolidationKey: string;
    consolidationDisplay: string;
    pfp: string;
    level: number;
  }>
) {
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
      className="tw-bg-transparent tw-h-[40px] tw-object-contain"
    />
  ) : (
    <></>
  );

  return (
    <div className="d-flex align-items-center gap-3">
      <a
        href={`/${link}`}
        className="no-wrap d-flex gap-3 decoration-none align-items-center">
        {pfpImg}
        {props.level ? (
          <span className="d-flex gap-2 align-items-center">
            <UserCICAndLevel level={props.level} />
            <span>{display}</span>
          </span>
        ) : (
          <span>{display}</span>
        )}
      </a>
    </div>
  );
}
