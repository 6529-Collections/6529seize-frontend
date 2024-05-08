import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ProxyListGranted({
  profileProxies,
}: {
  readonly profileProxies: ProfileProxy[];
}) {
  const router = useRouter();
  const user = router.query.user as string;

  return (
    <ul>
      {profileProxies.map((proxy) => (
        <li key={proxy.id}>
          <Link href={`/${user}/proxy/${proxy.id}`}>
            {proxy.granted_to.handle}
          </Link>
        </li>
      ))}
    </ul>
  );
}
