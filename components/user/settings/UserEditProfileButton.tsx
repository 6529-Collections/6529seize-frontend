import { useRouter } from "next/router";

export default function UserEditProfileButton({ user }: { user: string }) {
  const router = useRouter()
  const goToSettings = () => {
    router.push(`/${user}/settings`);
  }
  return (
    <div>
      <button
        onClick={goToSettings}
        type="button"
        className="tailwind-scope tw-bg-neutral-100 tw-px-4 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-neutral-900 tw-border tw-border-solid tw-border-neutral-600 tw-rounded-sm hover:tw-bg-neutral-200 hover:tw-border-neutral-600 
        tw-transition tw-duration-300 tw-ease-out"
      >
        Edit profile
      </button>
    </div>
  );
}
