import Link from "next/link";
import { useState } from "react";

export default function ChatItemHrefButtons({
  href,
  relativeHref,
}: {
  href: string;
  relativeHref?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    });
  };

  return (
    <div className="tw-mt-1 tw-h-full tw-flex tw-flex-col tw-gap-y-2 tw-justify-start">
      <button
        className={`tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-p-2 tw-bg-iron-900 tw-rounded-xl hover:tw-text-iron-400`}
        onClick={copyToClipboard}>
        <svg
          className={`tw-flex-shrink-0 tw-w-4 tw-h-4 tw-transition tw-ease-out tw-duration-300`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke={copied ? "#27ae60" : "currentColor"}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
      </button>
      {relativeHref && (
        <Link
          href={relativeHref}
          className={`tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-p-2 tw-bg-iron-900 tw-rounded-xl`}>
          <svg
            className={`tw-flex-shrink-0 tw-w-4 tw-h-4 tw-transition tw-ease-out tw-duration-300`}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="3"
            stroke="currentColor"
            fill="none">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path d="M55.4,32V53.58a1.81,1.81,0,0,1-1.82,1.82H10.42A1.81,1.81,0,0,1,8.6,53.58V10.42A1.81,1.81,0,0,1,10.42,8.6H32"></path>
              <polyline points="40.32 8.6 55.4 8.6 55.4 24.18"></polyline>
              <line x1="19.32" y1="45.72" x2="54.61" y2="8.91"></line>
            </g>
          </svg>
        </Link>
      )}
    </div>
  );
}
