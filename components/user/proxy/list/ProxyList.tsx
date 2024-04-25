import { useQuery } from "@tanstack/react-query";
import { ProxyMode } from "../UserPageProxy";
import { Page } from "../../../../helpers/Types";
import { ProfileProxyEntity } from "../../../../entities/IProxy";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useEffect } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";

export default function ProxyList({
  onModeChange,
  profile,
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
  readonly profile: IProfileAndConsolidations;
}) {
  const { data: receivedProfileProxies } = useQuery<Page<ProfileProxyEntity>>({
    queryKey: [
      QueryKey.PROFILE_RECEIVED_PROFILE_PROXIES,
      { handleOrWallet: profile.profile?.handle },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<ProfileProxyEntity>>({
        endpoint: `/profiles/${profile.profile?.handle}/proxies/received`,
      }),
    enabled: !!profile.profile?.handle,
  });

  useEffect(
    () => console.log(receivedProfileProxies),
    [receivedProfileProxies]
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => onModeChange(ProxyMode.CREATE)}
        className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-w-5 tw-h-5 tw-mr-2 -tw-ml-1"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Create new</span>
      </button>
    </div>
  );
}
