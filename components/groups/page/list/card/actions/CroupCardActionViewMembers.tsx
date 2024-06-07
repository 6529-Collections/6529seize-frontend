import Link from "next/link";
import { GroupFull } from "../../../../../../generated/models/GroupFull";

export default function CroupCardActionViewMembers({
  group,
}: {
  readonly group: GroupFull;
}) {
  const href = `community?page=1&group=${group.id}`;
  return (
    <Link
      href={href}
      target="_blank"
      className="tw-no-underline tw-inline-flex tw-items-center tw-border-0 tw-bg-transparent tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
    >
      <svg
        className="tw-size-5 t w-flex-shrink-0 tw-mr-2"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>View members</span>
    </Link>
  );
}
