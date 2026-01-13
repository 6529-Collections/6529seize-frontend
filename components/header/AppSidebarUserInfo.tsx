import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { useIdentity } from "@/hooks/useIdentity";
import Image from "next/image";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import UserLevel from "../user/utils/level/UserLevel";
import AppSidebarUserStats from "./AppSidebarUserStats";

export default function AppSidebarUserInfo() {
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useAuth();
  const { profile } = useIdentity({
    handleOrWallet: address ?? null,
    initialProfile: null,
  });

  const handleOrWallet = (() => {
    if (activeProfileProxy)
      return (
        activeProfileProxy.created_by.handle ??
        activeProfileProxy.created_by.primary_address
      );
    if (profile?.handle) return profile.handle;
    if (address) return address;
    return "";
  })();

  const label = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.handle;
    if (profile?.handle) return profile.handle;
    if (address) return address.slice(0, 6);
    return "";
  })();

  const pfp = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.pfp;
    return profile?.pfp ?? null;
  })();

  const resolvedPfp = pfp && resolveIpfsUrlSync(pfp);

  const source = activeProfileProxy?.created_by ?? profile;

  const level = source?.level ?? 0;
  const tdh = source?.tdh ?? 0;
  const tdh_rate = source?.tdh_rate ?? 0;
  const rep = source?.rep ?? 0;
  const xtdh = source?.xtdh ?? 0;
  const xtdh_rate = source?.xtdh_rate ?? 0;
  const cic = source?.cic ?? 0;

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-3 tw-py-2">
      {resolvedPfp ? (
        <div className="tw-relative tw-h-12 tw-w-12">
          <Image
            src={resolvedPfp}
            alt={`${handleOrWallet}'s profile picture`}
            fill
            sizes="48px"
            className="tw-rounded-full tw-bg-iron-900 tw-object-contain tw-ring-2 tw-ring-iron-700"
          />
        </div>
      ) : (
        <div className="tw-h-12 tw-w-12 tw-rounded-full tw-bg-iron-900 tw-ring-2 tw-ring-iron-700" />
      )}
      <div className="tw-flex tw-flex-col tw-items-start tw-space-y-1">
        <span className="tw-truncate tw-text-base tw-font-semibold tw-text-iron-50 sm:tw-text-lg">
          {label}
        </span>
        <UserLevel level={level} size="xs" />
      </div>
      <AppSidebarUserStats
        handle={handleOrWallet}
        tdh={tdh}
        tdh_rate={tdh_rate}
        xtdh={xtdh}
        xtdh_rate={xtdh_rate}
        rep={rep}
        cic={cic}
        profileId={profile?.id ?? null}
      />
    </div>
  );
}
