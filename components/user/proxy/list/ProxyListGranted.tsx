import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import Link from "next/link";
import { useRouter } from "next/router";
import ProxyListItem from "./ProxyListItem";

export default function ProxyListGranted({
  profileProxies,
}: {
  readonly profileProxies: ProfileProxy[];
}) {
  const router = useRouter();
  const user = router.query.user as string;

  return (
    <div className="tw-space-y-4">
      {profileProxies.map((profileProxy) => (
        <ProxyListItem key={profileProxy.id} profileProxy={profileProxy}/>
      ))}
    </div>
  );
}
