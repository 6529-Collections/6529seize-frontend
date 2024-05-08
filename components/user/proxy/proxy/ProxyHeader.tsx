import Link from "next/link";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";

export default function ProxyHeader({
  profileProxy,
}: {
  readonly profileProxy: ProfileProxy;
}) {
  return (
    <div className="tw-mt-2 sm:tw-mt-4">
      <div className="tw-divide-y tw-divide-iron-700 tw-divide-solid tw-divide-x-0">
        <div className="tw-py-4 tw-px-4 tw-relative tw-flex tw-items-center tw-gap-x-4 hover:tw-bg-iron-900 tw-transiton tw-duration-300 tw-ease-out">
          <div className="tw-min-w-0 tw-flex-auto">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-400">
              Receiver
            </span>
            <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-3">
              <img
                src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800"
              />
              <p className="tw-mb-0 tw-flex-auto tw-font-semibold tw-text-base">
                <Link
                  href={`/${profileProxy.granted_to.handle}/proxy`}
                  className="tw-text-iron-50 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-400"
                >
                  {profileProxy.granted_to.handle}
                </Link>
              </p>
              <Link
                href={`/${profileProxy.created_by.handle}/proxy`}
                className="tw-text-iron-50 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-400"
              >
                {profileProxy.created_by.handle}
              </Link>
            </div>
            <div className="tw-mt-3 tw-flex tw-items-center tw-gap-x-2.5 tw-text-md tw-font-medium tw-leading-6 tw-text-iron-400">
              <p className="tw-mb-0">Allocate Rep</p>
              <svg
                viewBox="0 0 2 2"
                className="tw-h-0.5 tw-w-0.5 tw-flex-none tw-fill-iron-300"
              >
                <circle cx="1" cy="1" r="1" />
              </svg>
              <p className="tw-mb-0">Allocate CIC</p>
            </div>
          </div>
          <div className="tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-400/10 tw-ring-iron-400/20">
            Pending
          </div>
        </div>
      </div>
    </div>
  );
}
