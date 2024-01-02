import { useRouter } from "next/router";
import {
  ProfileActivityLog,
  ProfileActivityLogRatingEditContentMatter,
  ProfileActivityLogType,
} from "../../../../../entities/IProfile";

export default function ProfileActivityLogItemHandle({
  log,
  user,
}: {
  readonly log: ProfileActivityLog;
  readonly user: string | null;
}) {
  const router = useRouter();

  const goToProfile = () => {
    const targetUser = log?.profile_handle;
    if (!targetUser) return;
    if (router.route === "/[user]/rep") {
      router.push(`/${targetUser}/rep`);
      return;
    }
    if (router.route === "/[user]/identity") {
      router.push(`/${targetUser}/identity`);
      return;
    }

    if (
      log.type === ProfileActivityLogType.RATING_EDIT &&
      log.contents.rating_matter ===
        ProfileActivityLogRatingEditContentMatter.REP
    ) {
      router.push(`/${targetUser}/rep`);
      return;
    }

    router.push(`/${targetUser}/identity`);
  };

  const isCurrentUser =
    user?.toLowerCase() === log?.profile_handle?.toLowerCase();

  return (
    <button
      onClick={goToProfile}
      className="tw-bg-transparent tw-border-none tw-leading-4 tw-p-0"
      disabled={isCurrentUser}
    >
      <span
        className={`${
          isCurrentUser ? "" : "hover:tw-underline tw-cursor-pointer"
        } tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100`}
      >
        {log?.profile_handle}
      </span>
    </button>
  );
}
