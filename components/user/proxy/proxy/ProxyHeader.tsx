import Link from "next/link";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";

export default function ProxyHeader({
  profileProxy,
}: {
  readonly profileProxy: ProfileProxy;
}) {
  return (
    <div>
      <div>
        <Link href={`/${profileProxy.created_by.handle}/proxy`}>
          Grantor: {profileProxy.created_by.handle}
        </Link>
      </div>
      <div>
        <Link href={`/${profileProxy.granted_to.handle}/proxy`}>
          Receiver: {profileProxy.granted_to.handle}
        </Link>
      </div>
    </div>
  );
}
