import { useRouter } from "next/router";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";

export default function ProxyListItem({
  profileProxy,
}: {
  readonly profileProxy: ProfileProxy;
}) {
  const router = useRouter();
  const user = router.query.user as string;
  const goToProxy = () => router.push(`/${user}/proxy/${profileProxy.id}`);
  return (
    <div
      onClick={goToProxy}
      className="tw-cursor-pointer tw-py-2 tw-divide-y tw-divide-iron-700 tw-divide-solid tw-divide-x-0 tw-rounded-lg tw-ring-1 tw-ring-iron-600"
    >
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-px-4 tw-py-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
            className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
          />
          <p className="tw-mb-0 tw-flex-auto tw-font-medium tw-text-base">
            {profileProxy.created_by.handle}
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
            {profileProxy.granted_to.handle}
          </p>
        </div>
      </div>
      <div className="tw-mt-2 tw-px-4 tw-divide-y tw-divide-iron-700 tw-divide-solid tw-divide-x-0">
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-py-2">
          <div className="tw-col-span-2">
            <div className="tw-flex tw-items-center tw-gap-x-3">
              <p className="tw-mb-0 tw-text-md tw-font-medium tw-text-iron-50">
                action type
              </p>
            </div>
          </div>
          <div className="tw-inline-flex tw-col-span-1">
            <div className="tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-[#FEC84B] tw-bg-[#FEC84B]/10 tw-ring-[#FEC84B]/20">
              Pending
            </div>
            <div className="tw-hidden tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-green tw-bg-green/10 tw-ring-green/20">
              Accepted
            </div>
            <div className="tw-hidden tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-red tw-bg-red/10 tw-ring-red/20">
              Rejected
            </div>
            <div className="tw-hidden tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-red tw-bg-red/10 tw-ring-red/20">
              Revoked
            </div>
            <div className="tw-hidden tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-iron-300 tw-bg-iron-400/10 tw-ring-iron-400/20">
              Expired
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
