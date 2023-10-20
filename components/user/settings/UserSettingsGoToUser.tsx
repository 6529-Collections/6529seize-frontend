import { useRouter } from "next/router";

export default function UserSettingsGoToUser({ user }: { user: string }) {
  const router = useRouter();
  const goBackToUser = () => {
    router.push(`/${user}`);
  };
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <button
        onClick={goBackToUser}
        type="button"
        className="tw-h-8 tw-w-8 tw-inline-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-white tw-rounded-full tw-bg-white hover:tw-bg-neutral-200 hover:tw-border-white tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-w-5 tw-h-5 tw-text-neutral-900 tw-transition tw-duration-300 tw-ease-out"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 12H4M4 12L10 18M4 12L10 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="tw-inline-flex tw-items-center tw-gap-x-2">
        <span className="tw-text-2xl tw-font-bold tw-text-white">{user}</span>
      </div>
    </div>
  );
}
