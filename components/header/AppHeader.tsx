"use client";

import { capitalizeEveryWord, formatAddress } from "@/helpers/Helpers";
import Image from "next/image";
import { useIdentity } from "@/hooks/useIdentity";
import { useWaveById } from "@/hooks/useWaveById";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import BackButton from "../navigation/BackButton";
import Spinner from "../utils/Spinner";
import AppSidebar from "./AppSidebar";
import HeaderSearchButton from "./header-search/HeaderSearchButton";
import HeaderActionButtons from "./HeaderActionButtons";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useNavigationHistoryContext } from "@/contexts/NavigationHistoryContext";



const COLLECTION_TITLES: Record<string, string> = {
  "the-memes": "The Memes",
  "6529-gradient": "6529 Gradient",
  "meme-lab": "Meme Lab",
  "nextgen": "NextGen",
};

const sliceString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  const half = Math.floor(length / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

const getCollectionTitle = (basePath: string, pageTitle: string): string | null => {
  const prefix = COLLECTION_TITLES[basePath];
  if (prefix && !Number.isNaN(Number(pageTitle))) {
    return `${prefix} #${pageTitle}`;
  }
  return null;
};

const getRememesTitle = (pathSegments: string[]): string | null => {
  if (pathSegments[0] !== "rememes") return null;
  const contract = pathSegments[1];
  const tokenId = pathSegments[2];
  if (contract && tokenId) {
    return `Rememes ${formatAddress(contract)} #${sliceString(tokenId, 10)}`;
  }
  return null;
};

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const myStream = useMyStreamOptional();
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const { canGoBack } = useNavigationHistoryContext();
  const { profile } = useIdentity({
    handleOrWallet: address ?? null,
    initialProfile: null,
  });

  const pfp = (() => {
    if (activeProfileProxy) return activeProfileProxy.created_by.pfp;
    return profile?.pfp ?? null;
  })();

  const pathSegments = (pathname ?? "").split("/").filter(Boolean);
  const basePath = pathSegments.length ? pathSegments[0] : "";
  const pageTitle = pathSegments.length
    ? pathSegments[pathSegments.length - 1]
        ?.replace(/[-_]/g, " ")
        .replace(/^./, (c) => c.toUpperCase())
    : "Home";

  const waveId = myStream?.activeWave.id ?? null;
  const { wave, isLoading, isFetching } = useWaveById(waveId);

  const isWavesRoute = pathname === "/waves";
  const isMessagesRoute = pathname === "/messages";

  const isCreateRoute =
    pathname === "/waves/create" || pathname === "/messages/create";
  const isInsideWave = !!waveId;

  const isProfilePage = typeof params?.["user"] === "string";

  const showBackButton =
    isInsideWave || isCreateRoute || (isProfilePage && canGoBack);

  const finalTitle: React.ReactNode = (() => {
    if (pathname === "/waves/create") return "Waves";
    if (pathname === "/messages/create") return "Messages";
    if (isWavesRoute && !waveId) return "Waves";
    if (isMessagesRoute && !waveId) return "Messages";
    if (waveId) {
      if (isLoading || isFetching || wave?.id !== waveId) return <Spinner />;
      return wave?.name ?? "Wave";
    }

    const collectionTitle = getCollectionTitle(basePath!, pageTitle!);
    if (collectionTitle) return collectionTitle;

    const rememesTitle = getRememesTitle(pathSegments);
    if (rememesTitle) return rememesTitle;

    return sliceString(capitalizeEveryWord(pageTitle!), 20);
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
            }`}>
            {address ? (
              pfp ? (
                <Image
                  src={pfp}
                  alt="pfp"
                  width={40}
                  height={40}
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
