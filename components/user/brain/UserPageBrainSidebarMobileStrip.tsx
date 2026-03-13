"use client";

import type { QueryStatus } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import WavesIcon from "@/components/common/icons/WavesIcon";

interface UserPageBrainSidebarMobileStripProps {
  readonly createdWaves: ApiWave[];
  readonly createdStatus: QueryStatus;
  readonly createdError: unknown;
  readonly mostActiveWaves: ApiWave[];
  readonly mostActiveStatus: QueryStatus;
  readonly mostActiveError: unknown;
  readonly onOpenCreatedWaves: () => void;
}

function UserPageBrainSidebarMobileWavePill({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
  const href = getWaveRoute({
    waveId: wave.id,
    isDirectMessage,
    isApp: false,
  });
  const imageSrc = wave.picture
    ? getScaledImageUri(wave.picture, ImageScale.W_200_H_200)
    : null;
  const FallbackIcon = isDirectMessage ? ChatBubbleLeftRightIcon : WavesIcon;

  return (
    <Link
      href={href}
      prefetch={false}
      className="tw-group tw-inline-flex tw-h-9 tw-max-w-[14rem] tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-p-1 tw-pr-3 tw-no-underline tw-shadow-sm tw-transition-all tw-duration-200 desktop-hover:hover:tw-border-white/[0.15] desktop-hover:hover:tw-bg-white/[0.05]"
    >
      <div className="tw-relative tw-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={wave.name ? `Wave ${wave.name}` : "Wave picture"}
            fill
            sizes="28px"
            className="tw-object-cover tw-transition-transform tw-duration-300 desktop-hover:group-hover:tw-scale-105"
          />
        ) : (
          <FallbackIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-300" />
        )}
      </div>
      <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-colors desktop-hover:group-hover:tw-text-iron-100">
        {wave.name}
      </span>
    </Link>
  );
}

function MobileWavePillSkeleton({ keyId }: { readonly keyId: string }) {
  return (
    <div
      key={keyId}
      className="tw-inline-flex tw-h-9 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/70 tw-p-1 tw-pr-3"
    >
      <div className="tw-h-7 tw-w-7 tw-shrink-0 tw-animate-pulse tw-rounded-full tw-bg-white/[0.07]" />
      <div className="tw-h-3 tw-w-20 tw-animate-pulse tw-rounded tw-bg-white/[0.07]" />
    </div>
  );
}

export default function UserPageBrainSidebarMobileStrip({
  createdWaves,
  createdStatus,
  createdError,
  mostActiveWaves,
  mostActiveStatus,
  mostActiveError,
  onOpenCreatedWaves,
}: UserPageBrainSidebarMobileStripProps) {
  const shouldShowCreatedLoading = createdStatus === "pending";
  const shouldShowCreatedWaves =
    (createdError === null || createdError === undefined) &&
    createdWaves.length > 0;
  const shouldShowMostActiveLoading = mostActiveStatus === "pending";
  const shouldShowMostActiveWaves =
    (mostActiveError === null || mostActiveError === undefined) &&
    mostActiveWaves.length > 0;
  const shouldShowCreatedSection =
    shouldShowCreatedLoading || shouldShowCreatedWaves;
  const shouldShowMostActiveSection =
    shouldShowMostActiveLoading || shouldShowMostActiveWaves;

  if (!shouldShowCreatedSection && !shouldShowMostActiveSection) {
    return null;
  }

  const firstCreatedWave = createdWaves[0];
  const remainingCreatedCount = Math.max(createdWaves.length - 1, 0);
  let createdSectionContent: ReactNode = null;

  if (shouldShowCreatedLoading) {
    createdSectionContent = (
      <>
        <MobileWavePillSkeleton keyId="created-0" />
        <MobileWavePillSkeleton keyId="created-1" />
      </>
    );
  } else if (firstCreatedWave) {
    createdSectionContent = (
      <>
        <UserPageBrainSidebarMobileWavePill wave={firstCreatedWave} />
        {remainingCreatedCount > 0 && (
          <button
            type="button"
            onClick={onOpenCreatedWaves}
            className="tw-inline-flex tw-h-9 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-400 tw-shadow-sm tw-transition-all tw-duration-200 desktop-hover:hover:tw-border-white/[0.15] desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-iron-100"
            aria-label="View all created waves"
          >
            <PlusIcon className="tw-h-3 tw-w-3 tw-flex-shrink-0" />
            <span>{remainingCreatedCount}</span>
          </button>
        )}
      </>
    );
  }

  return (
    <section
      aria-label="Brain waves strip"
      className="lg:tw-hidden"
      data-testid="brain-sidebar-mobile-strip"
    >
      <div className="tw-relative tw-overflow-hidden">
        <div className="tw-flex tw-items-end tw-gap-4 tw-overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden">
          {shouldShowCreatedSection && (
            <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2">
              <span className="tw-px-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                Created
              </span>
              <div className="tw-flex tw-items-center tw-gap-2">
                {createdSectionContent}
              </div>
            </div>
          )}

          {shouldShowCreatedSection && shouldShowMostActiveSection && (
            <div className="tw-mb-1 tw-h-11 tw-w-px tw-shrink-0 tw-bg-white/5" />
          )}

          {shouldShowMostActiveSection && (
            <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2">
              <span className="tw-px-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                Active In
              </span>
              <div className="tw-flex tw-items-center tw-gap-2">
                {shouldShowMostActiveLoading
                  ? [0, 1, 2].map((key) => (
                      <MobileWavePillSkeleton
                        key={`most-active-${key}`}
                        keyId={`most-active-${key}`}
                      />
                    ))
                  : mostActiveWaves
                      .slice(0, 3)
                      .map((wave) => (
                        <UserPageBrainSidebarMobileWavePill
                          key={wave.id}
                          wave={wave}
                        />
                      ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
