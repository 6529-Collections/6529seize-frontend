import { useRouter } from "next/router";

export default function UserEditProfileButton({ user }: { user: string }) {
  const router = useRouter();
  const goToSettings = () => {
    router.push(`/${user}/settings`);
  };
  return (
    <div>
      <button
        onClick={goToSettings}
        type="button"
        className="tw-relative tw-inline-flex tw-items-center tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-rounded-lg tw-shadow-sm hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
      >
        Edit profile
      </button>
    </div>
  );
}
