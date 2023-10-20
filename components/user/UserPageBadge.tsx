export default function UserPageBadge({
  children,
  count,
  mycounts,
}: {
  children: React.ReactNode;
  count: number;
  mycounts: number;
}) {
  return (
    <span
      className={`${
        mycounts
          ? "tw-bg-blue-600/[0.15] tw-ring-blue-600 tw-font-bold tw-text-white"
          : "tw-bg-neutral-400/[0.15] tw-ring-neutral-400/20  tw-font-medium tw-text-neutral-300"
      } tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-[1px] tw-px-3 tw-py-1 tw-ring-1 tw-ring-inset`}
    >
      <span className="tw-text-[0.9375rem] tw-leading-normal">{children}</span>
      <span
        className={`${
          mycounts
            ? "tw-bg-white/10"
            : "tw-bg-neutral-600 hover:tw-bg-neutral-500"
        } tw-cursor-pointer tw-inline-flex tw-items-center tw-gap-x-2 tw-px-2 tw-py-0.5 tw-rounded-[1px]  tw-text-white tw-text-sm tw-font-bold  tw-transition tw-duration-300 tw-ease-out`}
      >
        {count}
        <svg
          className="tw-h-4 tw-w-4 tw-text-white"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}
