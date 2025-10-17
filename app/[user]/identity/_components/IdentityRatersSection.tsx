import { use } from "react";
import type {
  IdentityRatersPage,
} from "@/app/[user]/identity/_lib/identityShared";
import ProfileRatersTableWrapper, {
  type ProfileRatersParams,
} from "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
import type { Page as PageWithCount } from "@/helpers/Types";
import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";

export function IdentityRatersSection({
  resource,
  initialParams,
  handleOrWallet,
}: {
  readonly resource: Promise<IdentityRatersPage>;
  readonly initialParams: ProfileRatersParams;
  readonly handleOrWallet: string;
}): React.JSX.Element {
  const ratings = use(resource);
  return (
    <ProfileRatersTableWrapper
      initialParams={initialParams}
      handleOrWallet={handleOrWallet}
      initialData={
        ratings as PageWithCount<RatingWithProfileInfoAndLevel>
      }
    />
  );
}
