import { use } from "react";
import type {
  IdentityTabParams,
} from "@/app/[user]/identity/_lib/identityShared";
import type { CountlessPage } from "@/helpers/Types";
import type { ProfileActivityLog } from "@/entities/IProfile";
import UserPageIdentityActivityLog from "@/components/user/identity/activity/UserPageIdentityActivityLog";

export function IdentityActivitySection({
  resource,
  initialParams,
}: {
  readonly resource: Promise<CountlessPage<ProfileActivityLog> | null>;
  readonly initialParams: IdentityTabParams["activityLogParams"];
}): React.JSX.Element {
  const activityLog = use(resource);

  return (
    <UserPageIdentityActivityLog
      initialActivityLogParams={initialParams}
      initialActivityLogData={activityLog ?? undefined}
    />
  );
}
