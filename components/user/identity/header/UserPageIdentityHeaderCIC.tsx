import NicRatingsOverview from "@/components/user/rep/NicRatingsOverview";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageIdentityHeaderCIC(props: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
  readonly onRateClick?: () => void;
}) {
  return <NicRatingsOverview {...props} />;
}
