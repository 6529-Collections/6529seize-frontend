import Link from "next/link";
import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import { useRouter } from "next/router";
import { getProfileProxyActionStatus } from "../../../../../helpers/profile-proxy.helpers";

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
    <li>
      <Link href={`/${user}/proxy/${profileProxyId}/actions/${action.id}`}>
        <div className="tw-inline-flex tw-space-x-2">
          <div>{action.action_type}</div>
          <div className="tw-border tw-border-solid tw-rounded-lg tw-px-2">
            {status}
          </div>
        </div>
      </Link>
    </li>
  );
}
