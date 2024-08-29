import { useQuery } from "@tanstack/react-query";
import { TypedNotification } from "../../../types/feed.types";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import NotificationItems from "./NotificationItems";
import { ProfileAvailableDropRateResponse } from "../../../entities/IProfile";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { useContext } from "react";
import { AuthContext } from "../../auth/Auth";
import { commonApiFetch } from "../../../services/api/common-api";

interface NotificationsWrapperProps {
  readonly items: TypedNotification[];
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}

export default function NotificationsWrapper({
  items,
  loading,
  onBottomIntersection,
}: NotificationsWrapperProps) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const { data: availableRateResponse } =
    useQuery<ProfileAvailableDropRateResponse>({
      queryKey: [
        QueryKey.PROFILE_AVAILABLE_DROP_RATE,
        connectedProfile?.profile?.handle,
      ],
      queryFn: async () =>
        await commonApiFetch<ProfileAvailableDropRateResponse>({
          endpoint: `profiles/${connectedProfile?.profile?.handle}/drops/available-credit-for-rating`,
        }),
      enabled: !!connectedProfile?.profile?.handle && !activeProfileProxy,
    });


  return (
    <div className="tw-relative">
      <NotificationItems
        items={items}
        availableCredit={availableRateResponse?.available_credit_for_rating ?? null}
        onBottomIntersection={onBottomIntersection}
      />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
    </div>
  );
}
