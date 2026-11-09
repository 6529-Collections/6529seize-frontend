import { useNicRatingsOverview } from "@/components/user/rep/useNicRatingsOverview";
import NicRatingsOverview from "@/components/user/rep/NicRatingsOverview";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageIdentityHeaderCIC(props: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
  readonly onRateClick?: () => void;
}) {
  const ratings = useNicRatingsOverview(props.profile, props.cicOverview);
  return (
    <NicRatingsOverview
      profile={props.profile}
      ratings={ratings}
      {...(props.onRateClick ? { onRateClick: props.onRateClick } : {})}
    />
  );
}
