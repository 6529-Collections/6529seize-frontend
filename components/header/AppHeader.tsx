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
import BackButton from "../navigation/BackButton";
import Spinner from "../utils/Spinner";
import { useNavigationHistoryContext } from "../../contexts/NavigationHistoryContext";
import { capitalizeEveryWord, formatAddress } from "../../helpers/Helpers";
import HeaderActionButtons from "./HeaderActionButtons";

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
  const { canGoBack } = useNavigationHistoryContext();

  const pfp = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.pfp;
    return profile?.pfp ?? null;
  })();

  const pathSegments = router.asPath.split("?")[0].split("/").filter(Boolean);
  const basePath = pathSegments.length ? pathSegments[0] : "";
  const pageTitle = pathSegments.length
    ? pathSegments[pathSegments.length - 1]
        .replace(/[-_]/g, " ")
        .replace(/^./, (c) => c.toUpperCase())
    : "Home";

  const waveId =
    typeof router.query.wave === "string" ? router.query.wave : null;
  const { wave, isLoading, isFetching } = useWaveById(waveId);
  const isProfileRoute = router.pathname.startsWith("/[user]");

  const showBackButton =
    (!!waveId && activeView === null) || (isProfileRoute && canGoBack);

  const finalTitle: React.ReactNode = (() => {
    if (activeView === "waves") return "Waves";
    if (activeView === "messages") return "Messages";
    if (waveId) {
      if (isLoading || isFetching || wave?.id !== waveId) return <Spinner />;
      return wave?.name ?? "Wave";
    }

    if (basePath && !isNaN(Number(pageTitle))) {
      switch (basePath) {
        case "the-memes":
          return `The Memes #${pageTitle}`;
        case "6529-gradient":
          return `6529 Gradient #${pageTitle}`;
        case "meme-lab":
          return `Meme Lab #${pageTitle}`;
        case "nextgen":
          return `NextGen #${pageTitle}`;
      }
    }

    const slice = (str: string, length: number) => {
      if (str.length <= length) return str;

      const half = Math.floor(length / 2);
      const firstPart = str.slice(0, half);
      const lastPart = str.slice(-half);
      return `${firstPart}...${lastPart}`;
    };

    if (basePath === "rememes") {
      const contract = pathSegments[1];
      const tokenId = pathSegments[2];
      if (contract && tokenId) {
        const formattedContract = formatAddress(contract);
        const formattedTokenId = formatAddress(tokenId);
        return `Rememes ${formattedContract} #${slice(formattedTokenId, 10)}`;
      }
    }

    return slice(capitalizeEveryWord(pageTitle), 20);
  })();

  return (
    <div className="tw-w-full tw-bg-black tw-text-iron-50 tw-pt-[env(safe-area-inset-top,0px)]">
      <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-h-16">
        {showBackButton && <BackButton />}
        {!showBackButton && (
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className={`tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-h-10 tw-w-10 tw-rounded-full tw-border tw-border-solid ${
              address
                ? "tw-bg-iron-900 tw-border-white/20"
                : "tw-bg-transparent tw-border-transparent"
            }`}
          >
            {address ? (
              pfp ? (
                <img
                  src={pfp}
                  alt="pfp"
                  className="tw-h-10 tw-w-10 tw-rounded-full tw-object-contain tw-flex-shrink-0"
                />
              ) : (
                <div className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-flex-shrink-0" />
              )
            ) : (
              <Bars3Icon className="tw-size-6 tw-flex-shrink-0" />
            )}
          </button>
        )}
        <div className="tw-flex-1 tw-text-center tw-font-semibold tw-text-sm">
          {finalTitle}
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <HeaderActionButtons />
          <HeaderSearchButton />
        </div>
      </div>
      <AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
