import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { CountlessPage } from "@/helpers/Types";
import { ProfileActivityLog } from "@/entities/IProfile";
import { commonApiFetch } from "@/services/api/common-api";
import { formatTimestampToMonthYear } from "@/helpers/Helpers";

interface UserPageHeaderProfileEnabledAtProps {
  readonly handleOrWallet: string | null;
}

const UserPageHeaderProfileEnabledAt: FC<
  UserPageHeaderProfileEnabledAtProps
> = ({ handleOrWallet }) => {
  const { data } = useQuery<CountlessPage<ProfileActivityLog>>({
    queryKey: ["profile-created-at", handleOrWallet],
    queryFn: () => {
      return commonApiFetch<CountlessPage<ProfileActivityLog>>({
        endpoint: `profile-logs`,
        params: {
          profile: handleOrWallet ?? "",
          log_type: "PROFILE_CREATED",
        },
      });
    },
    enabled: !!handleOrWallet,
  });

  const createdAt = data?.data[0].created_at;

  if (!createdAt) {
    return null;
  }

  return (
    <div className="tw-mt-2">
      <p
        className="tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal"
        suppressHydrationWarning
      >
        Profile Enabled:{" "}
        {formatTimestampToMonthYear(new Date(createdAt).getTime())}
      </p>
    </div>
  );
};

export default UserPageHeaderProfileEnabledAt;
