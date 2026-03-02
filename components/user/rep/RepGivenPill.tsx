import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../utils/UserCICAndLevel";

export default function RepGivenPill({
  rating,
}: {
  readonly rating: RatingWithProfileInfoAndLevel;
}) {
  const ratingStr =
    rating.rating > 0
      ? `+${formatNumberWithCommas(rating.rating)}`
      : formatNumberWithCommas(rating.rating);
  const ratingColor = rating.rating > 0 ? "tw-text-emerald-500" : "tw-text-rose-500";

  return (
    <Link
      href={`/${rating.handle}`}
      className="group tw-inline-flex tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-4 tw-py-2.5 tw-no-underline tw-backdrop-blur-md tw-transition-all tw-duration-300 tw-ease-out hover:tw-border-white/20 hover:tw-bg-white/10 hover:tw-shadow-md"
    >
      <span className="tw-inline-flex tw-items-center tw-gap-1.5">
        <span className="tw-text-sm tw-font-medium tw-text-white">
          {rating.handle}
        </span>
        <UserCICAndLevel
          level={rating.level}
          size={UserCICAndLevelSize.SMALL}
        />
        <span className={`tw-text-sm tw-font-medium ${ratingColor}`}>
          {ratingStr}
        </span>
      </span>
    </Link>
  );
}
