import Link from "next/link";
import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import { useRouter } from "next/router";
import { getProfileProxyActionStatus } from "../../../../../helpers/profile-proxy.helpers";
import { PROFILE_PROXY_ACTION_LABELS } from "../../../../../entities/IProxy";

export default function ProxyActionRow({
  action,
  profileProxyId,
}: {
  readonly action: ProfileProxyAction;
  readonly profileProxyId: string;
}) {
  const router = useRouter();
  const user = router.query.user as string;
  const status = getProfileProxyActionStatus(action);
  return (
    /*   <li>
      <Link href={`/${user}/proxy/${profileProxyId}/actions/${action.id}`}>
        <div className="tw-inline-flex tw-space-x-2">
          <div>{action.action_type}</div>
          <div className="tw-border tw-border-solid tw-rounded-lg tw-px-2">
            {status}
          </div>
        </div>
      </Link>
    </li> */
    <div className="tw-grid tw-grid-cols-12 tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-py-2">
      <div className="tw-col-span-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <p className="tw-mb-0 tw-text-md tw-font-medium tw-text-iron-50">
            {PROFILE_PROXY_ACTION_LABELS[action.action_type]}
          </p>
        </div>
      </div>
      <div className="tw-inline-flex tw-col-span-1">
        <div className="tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-[#FEC84B] tw-bg-[#FEC84B]/10 tw-ring-[#FEC84B]/20">
          {/*   {status} */} Pending
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
      <div className="tw-col-span-6">
        <div className="tw-text-md tw-font-normal tw-text-iron-400">
          <div className="tw-flex tw-items-center  tw-justify-center tw-gap-x-3">
            <p className="tw-mb-0 tw-space-x-1 tw-whitespace-nowrap">
              <span>Credit:</span>
              <span className="tw-text-iron-300 tw-font-medium">20</span>
            </p>
            <svg
              viewBox="0 0 2 2"
              className="tw-h-0.5 tw-w-0.5 tw-flex-none tw-fill-gray-300"
            >
              <circle cx="1" cy="1" r="1" />
            </svg>
            <p className="tw-mb-0 tw-space-x-1 tw-whitespace-nowrap">
              <span>Category:</span>
              <span className="tw-text-iron-300 tw-font-medium">Cool Guy</span>
            </p>
            <svg
              viewBox="0 0 2 2"
              className="tw-h-0.5 tw-w-0.5 tw-flex-none tw-fill-gray-300"
            >
              <circle cx="1" cy="1" r="1" />
            </svg>
            <div className="tw-inline-flex tw-items-center tw-gap-x-1">
              <div className="tw-mb-0 tw-space-x-1 tw-whitespace-nowrap tw-max-w-56 tw-inline-flex tw-items-center">
                <span>Group:</span>
                <span className="tw-text-iron-300 tw-font-medium tw-truncate">
                  My awesome curation gf fg f g
                </span>
              </div>
              <div>
                <span className="tw-pr-1 tw-text-iron-400">/</span>
                <span className="tw-text-iron-300 tw-font-medium">by Simo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-col-span-3">
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-4">
          <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-2 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-500">
            <svg
              className="tw-h-5 tw-w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 10H3M16 2V6M8 2V6M9 16L11 18L15.5 13.5M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tw-inline-flex tw-space-x-1">
              <span>Start:</span>
              <span className="tw-text-iron-300">3 days</span>
            </span>
          </p>
          <p className="tw-flex tw-items-center tw-mb-0 tw-space-x-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-500">
            <svg
              className="tw-h-5 tw-w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>End:</span>
            <span className="tw-text-iron-300">7 days</span>
          </p>
        </div>
      </div>
    </div>
  );
}
