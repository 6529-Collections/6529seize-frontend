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

    <div className="tw-grid tw-grid-cols-10 tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-p-4 tw-rounded-lg tw-ring-1 tw-ring-iron-600">
      <div className="tw-col-span-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
            {PROFILE_PROXY_ACTION_LABELS[action.action_type]}
          </p>
        </div>
      </div>
      <div className="tw-inline-flex tw-col-span-2">
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
      <div className="tw-col-span-2">
        <div className="tw-text-base tw-font-normal tw-text-iron-400">
          <p className="tw-mb-0 tw-space-x-1 tw-whitespace-nowrap">
            <span className="tw-text-iron-300 tw-font-medium">20</span>
          </p>
        </div>
      </div>
      <div className="tw-col-span-2">
        <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-2 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-500">
          3 days
        </p>
      </div>
      <div className="tw-col-span-2">
        <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-2 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-500">
          7 days
        </p>
      </div>
    </div>
  );
}
