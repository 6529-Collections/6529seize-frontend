import Link from "next/link";
import { formatNumberWithCommas } from "@/helpers/Helpers";

export default function UserPageFollowers({
  handleOrWallet,
  followersCount,
}: {
  readonly handleOrWallet: string;
  readonly followersCount: number | null;
}) {
  const trimmedHandleOrWallet = handleOrWallet.trim();
  if (!trimmedHandleOrWallet) {
    return null;
  }

  const normalizedHandleOrWallet = trimmedHandleOrWallet.toLowerCase();
  const safeHandleOrWallet = encodeURIComponent(normalizedHandleOrWallet);
  const count = followersCount ?? 0;
  const label = count === 1 ? "Follower" : "Followers";

  return (
    <Link
      href={`/${safeHandleOrWallet}/followers`}
      className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
    >
      <span className="tw-text-base tw-font-semibold tw-text-iron-50">
        {formatNumberWithCommas(count)}
      </span>{" "}
      <span className="tw-text-base tw-font-medium tw-text-iron-400">
        {label}
      </span>
    </Link>
  );
}
