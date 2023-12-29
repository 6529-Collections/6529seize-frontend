import { SortDirection } from "../../../../../entities/ISort";

export default function UserPageRepRepsTableHeaderSortIcon({
  direction,
}: {
  readonly direction: SortDirection;
}) {
  return (
    <svg
      className={`${
        direction === SortDirection.ASC ? "tw-rotate-180" : "tw-rotate-0"
      } -tw-mt-0.5 tw-ml-2 tw-text-iron-400 group-hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out tw-h-4 tw-w-4`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 20V4M12 4L6 10M12 4L18 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
