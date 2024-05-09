import Link from "next/link";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";

export default function ProxyHeader({
  profileProxy,
}: {
  readonly profileProxy: ProfileProxy;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <img
          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt=""
          className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
        />
        <p className="tw-mb-0 tw-flex-auto tw-font-medium tw-text-base">
          <Link
            href={`/${profileProxy.created_by.handle}/proxy`}
            className="tw-text-iron-50 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-400"
          >
            {profileProxy.created_by.handle}
          </Link>
        </p>
      </div>
      <svg
        className="tw-h-5 tw-w-5 tw-text-iron-400"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 12H20M20 12L14 6M20 12L14 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <img
          src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt=""
          className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
        />
        <p className="tw-mb-0 tw-flex-auto tw-font-medium tw-text-base">
          <Link
            href={`/${profileProxy.granted_to.handle}/proxy`}
            className="tw-text-iron-50 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-400"
          >
            {profileProxy.granted_to.handle}
          </Link>
        </p>
      </div>
    </div>
  );
}
