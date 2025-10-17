import { use } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityHydrator from "@/components/user/identity/UserPageIdentityHydrator";
import type {
  IdentityHydrationPayload,
  IdentityTabParams,
} from "@/app/[user]/identity/_lib/identityShared";

export function IdentityHydratorSection({
  profile,
  handleOrWallet,
  params,
  hydrationPromise,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly params: IdentityTabParams;
  readonly hydrationPromise: Promise<IdentityHydrationPayload>;
}): React.JSX.Element {
  const { statements, cicGiven, cicReceived, activityLog } =
    use(hydrationPromise);

  return (
    <UserPageIdentityHydrator
      profile={profile}
      handleOrWallet={handleOrWallet}
      initialStatements={statements}
      initialActivityLogParams={params.activityLogParams}
      initialActivityLogData={activityLog ?? undefined}
      initialCICGivenParams={params.cicGivenParams}
      initialCicGivenData={cicGiven}
      initialCICReceivedParams={params.cicReceivedParams}
      initialCicReceivedData={cicReceived}
    />
  );
}
