import { useRouter } from "next/router";
import { ProfileActivityLogBase } from "../../../../../entities/IProfile";

export default function ProfileActivityLogItemHandle({
  log,
  user,
}: {
  readonly log: ProfileActivityLogBase;
  readonly user: string | null;
}) {
  const router = useRouter();

  const goToProfile = () => {
    router.push(`/${log.profile_handle}/identity`);
  };

  return (
    <button
      onClick={goToProfile}
      className="tw-bg-transparent tw-border-none"
      disabled={!!user}
    >
      <span
        className={`${
          user ? "" : "hover:tw-underline tw-cursor-pointer"
        } tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100`}
      >
        {log.profile_handle}
      </span>
    </button>
  );
}
