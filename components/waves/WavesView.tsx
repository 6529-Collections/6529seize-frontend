"use client";

import React from "react";
import CommunityCurations from "@/components/community-curations/CommunityCurations";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const WavesView: React.FC = () => {
  const myStream = useMyStreamOptional();
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();

  const serialisedWaveId = myStream?.activeWave.id ?? null;

  const showPlaceholder = !serialisedWaveId && !isApp;

  let content: React.ReactNode = null;

  if (serialisedWaveId) {
    content = (
      <MyStreamWave
        key={`wave-${serialisedWaveId}`}
        waveId={serialisedWaveId}
      />
    );
  } else if (showPlaceholder) {
    content = (
      <CommunityCurations
        topContent={
          <nav
            aria-label={t(locale, "wave.navigation.appSections")}
            className="tw-mb-5 lg:tw-hidden"
          >
            <Link
              href="/waves"
              prefetch={false}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-px-2 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 active:tw-bg-white/[0.05] desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
            >
              <ArrowLeftIcon
                aria-hidden="true"
                className="tw-size-4 tw-flex-shrink-0"
              />
              {t(locale, "navigation.primary.waves")}
            </Link>
          </nav>
        }
      />
    );
  }

  // Note: Wave views (MyStreamWave) manage their own activeDrop state
  // internally via MyStreamWaveChat. We pass null to BrainContent because
  // the wave's internal state controls the reply/quote input box.
  return (
    <BrainContent activeDrop={null} onCancelReplyQuote={() => {}}>
      {content}
    </BrainContent>
  );
};

export default React.memo(WavesView);
