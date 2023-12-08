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
        className="tw-relative tw-inline-flex tw-items-center tw-gap-x-2 tw-bg-iron-800 tw-px-4 tw-py-2 tw-text-sm tw-leading-6 tw-font-medium tw-text-iron-200 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-rounded-lg hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
      >
        Edit profile
      </button>
    </div>
  );
}
