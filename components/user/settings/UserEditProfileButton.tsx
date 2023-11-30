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
        className="tw-relative tw-inline-flex tw-items-center tw-gap-x-2 tw-bg-neutral-900 tw-px-4 tw-py-2 tw-text-sm tw-leading-6 tw-font-medium tw-text-neutral-200 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-500 tw-rounded-lg hover:tw-bg-white/5 tw-transition tw-duration-300 tw-ease-out"
      >
        Edit profile
      </button>
    </div>
  );
}
