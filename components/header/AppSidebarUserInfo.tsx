import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useAuth } from "../auth/Auth";
import { useIdentity } from "@/hooks/useIdentity";
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
    if (activeProfileProxy) return activeProfileProxy.created_by.handle;
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

  const level = activeProfileProxy
    ? activeProfileProxy.created_by.level
    : profile?.level ?? 0;
  const tdh = activeProfileProxy
    ? activeProfileProxy.created_by.tdh
    : profile?.tdh ?? 0;
  const tdh_rate = activeProfileProxy
    ? activeProfileProxy.created_by.tdh_rate
    : profile?.tdh_rate ?? 0;
  const rep = activeProfileProxy
    ? activeProfileProxy.created_by.rep
    : profile?.rep ?? 0;
  const xtdh = activeProfileProxy
    ? activeProfileProxy.created_by.xtdh
    : profile?.xtdh ?? 0;
  const xtdh_rate = activeProfileProxy
    ? activeProfileProxy.created_by.xtdh_rate
    : profile?.xtdh_rate ?? 0;
  const cic = activeProfileProxy
    ? activeProfileProxy.created_by.cic
    : profile?.cic ?? 0;

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-3 tw-py-2">
      {pfp ? (
        <img
          src={pfp}
          alt="pfp"
          className="tw-w-12 tw-h-12 tw-rounded-full tw-ring-2 tw-ring-iron-700 tw-bg-iron-900 tw-object-contain"
        />
      ) : (
        <div className="tw-w-12 tw-h-12 tw-rounded-full tw-ring-2 tw-ring-iron-700 tw-bg-iron-900" />
      )}
      <div className="tw-space-y-1 tw-flex tw-flex-col tw-items-start">
        <span className="tw-text-iron-50 tw-text-base sm:tw-text-lg tw-font-semibold tw-truncate">
          {label}
        </span>
        <UserLevel level={level} size="xs" />
      </div>
      <AppSidebarUserStats
        handle={handleOrWallet ?? ""}
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
