import { useState } from "react";
import AppSidebar from "./AppSidebar";
import HeaderSearchButton from "./header-search/HeaderSearchButton";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useAuth } from "../auth/Auth";
import { useIdentity } from "../../hooks/useIdentity";
import { useRouter } from "next/router";
import { useViewContext } from "../navigation/ViewContext";
import { useWaveById } from "../../hooks/useWaveById";

interface Props {
  readonly extraClass?: string;
}

export default function AppHeader(props: Readonly<Props>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useAuth();
  const router = useRouter();
  const { profile } = useIdentity({
    handleOrWallet: address ?? null,
    initialProfile: null,
  });
  const { activeView } = useViewContext();

  const pfp = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.pfp;
    return profile?.pfp ?? null;
  })();

  const pathSegments = router.asPath.split("?")[0].split("/").filter(Boolean);
  const pageTitle = pathSegments.length
    ? pathSegments[pathSegments.length - 1]
        .replace(/[-_]/g, " ")
        .replace(/^./, (c) => c.toUpperCase())
    : "Home";

  const waveId =
    typeof router.query.wave === "string" ? router.query.wave : null;
  const { wave } = useWaveById(waveId);

  const finalTitle = (() => {
    if (waveId) {
      return wave?.name ?? "Wave";
    }
    if (activeView === "waves") return "Waves";
    if (activeView === "messages") return "Messages";
    return pageTitle;
  })();

  return (
    <div className="tw-w-full tw-bg-black tw-text-iron-50 tw-pt-[env(safe-area-inset-top,0px)]">
      <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-h-16">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className={`tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-h-10 tw-w-10 tw-rounded-full tw-border tw-border-solid ${
            address && pfp
              ? "tw-bg-iron-900 tw-border-white/20 tw-border-solid"
              : "tw-bg-transparent tw-border-transparent"
          }`}
        >
          {address && pfp ? (
            <img
              src={pfp}
              alt="pfp"
              className="tw-h-10 tw-w-10 tw-rounded-full tw-object-contain tw-flex-shrink-0"
            />
          ) : (
            <Bars3Icon className="tw-size-6 tw-flex-shrink-0" />
          )}
        </button>
        <div className="tw-flex-1 tw-text-center tw-font-semibold tw-text-sm">
          {finalTitle}
        </div>
        <HeaderSearchButton />
      </div>
      <AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
