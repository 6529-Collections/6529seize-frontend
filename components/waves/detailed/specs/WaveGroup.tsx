import Link from "next/link";
import { WaveScope } from "../../../../generated/models/WaveScope";

export default function WaveGroup({
  scope,
  label,
}: {
  readonly scope: WaveScope;
  readonly label: string;
}) {
  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
      <span className="tw-font-medium tw-text-iron-400">{label}</span>
      <div className="tw-inline-flex tw-items-center tw-gap-x-2">
        {scope.group ? (
          <Link
            href={`/community?page=1&group=${scope.group.id}`}
            className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-gap-x-2"
          >
            {scope.group.author.pfp ? (
              <img
                className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800"
                src={scope.group.author.pfp}
                alt="Profile Picture"
              />
            ) : (
              <div className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800" />
            )}
            <span className="tw-font-medium  tw-text-base">
              {scope.group.name}
            </span>
          </Link>
        ) : (
          <span className="tw-font-medium tw-text-white tw-text-base">
            Anyone
          </span>
        )}
        <div>
          <svg
            className="tw-size-4 tw-text-success"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572M22 4L12 14.01L9 11.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
