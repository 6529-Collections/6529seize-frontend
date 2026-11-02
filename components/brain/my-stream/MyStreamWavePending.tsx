"use client";

import WaveChatLoading from "@/components/waves/WaveChatLoading";
import { usePublicWaveFeedReady } from "@/components/waves/PublicWaveFeedReady";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/Auth";
import { getDirectMessageProfileHref } from "@/helpers/waves/direct-message-profile.helpers";
import { usePathname } from "next/navigation";
import { getMessageIdFromPathname } from "@/helpers/navigation.helpers";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { t } from "@/i18n/messages";
import WavePicture from "@/components/waves/WavePicture";
import { useLayout } from "./layout/LayoutContext";

interface MyStreamWavePendingProps {
  readonly waveId: string;
  readonly isError?: boolean;
  readonly onRetry?: () => void;
  readonly children?: ReactNode;
}

export default function MyStreamWavePending({
  waveId,
  isError = false,
  onRetry,
  children,
}: MyStreamWavePendingProps) {
  usePublicWaveFeedReady(isError);
  const { waves, directMessages, activeWave } = useMyStream();
  const { isApp } = useDeviceInfo();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const locale = useBrowserLocale();
  const pathname = usePathname();
  const { waveViewStyle } = useLayout();
  // List data supplies identity only. Permissions and wave content still require
  // the full response; never seed the API cache with a partial wave.
  const preview =
    waves.list.find((wave) => wave.id === waveId) ??
    directMessages.list.find((wave) => wave.id === waveId);
  const isDirectMessage =
    getMessageIdFromPathname(pathname) === waveId ||
    directMessages.list.some((wave) => wave.id === waveId);
  const hasProfileIdentity = Boolean(
    getDirectMessageProfileHref({
      isDirectMessage,
      identity: preview?.name,
      connectedProfile,
      activeProfileProxyCreatedBy: activeProfileProxy?.created_by,
    })
  );
  const identityOffset = preview?.parentWaveId
    ? "md:tw-self-start md:-tw-mt-2"
    : "md:tw-self-start md:-tw-mt-1.5";
  const status = preview
    ? t(locale, "waves.loadingWave", { name: preview.name })
    : t(locale, "waves.loadingWaveUnknown");

  return (
    <div
      className="tailwind-scope tw-relative tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-col tw-bg-iron-950"
      data-testid="wave-pending"
      style={isApp ? waveViewStyle : undefined}
    >
      {!isApp && (
        <div className="tw-flex tw-shrink-0 tw-items-start tw-gap-x-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-2 tw-py-3 sm:tw-px-4 md:tw-py-2.5">
          <button
            type="button"
            aria-label={t(
              locale,
              isDirectMessage
                ? "waves.loadingBackMessages"
                : "waves.loadingBack"
            )}
            onClick={() => activeWave.set(null, { isDirectMessage })}
            className="tw-flex tw-h-9 tw-min-w-8 tw-shrink-0 tw-items-center tw-border-0 tw-bg-transparent tw-px-1.5 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:-tw-ml-2.5 sm:tw-px-2.5 lg:tw-hidden"
          >
            <ArrowLeftIcon
              aria-hidden="true"
              className="tw-size-5 sm:tw-size-6"
            />
          </button>
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-[13px] tw-pt-0.5">
            <div className="tw-size-9 tw-shrink-0 tw-self-start tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/30 tw-ring-offset-1 tw-ring-offset-iron-950">
              {preview && (
                <WavePicture
                  name={preview.name}
                  picture={preview.picture}
                  contributors={preview.contributors}
                />
              )}
            </div>
            <div
              className={`tw-flex tw-min-w-0 tw-flex-1 tw-flex-col ${
                hasProfileIdentity ? "" : identityOffset
              }`}
            >
              {preview?.parentWaveId && (
                <div aria-hidden="true" className="tw-h-6">
                  <div className="tw-h-2 tw-w-24 tw-rounded-md tw-bg-iron-800" />
                </div>
              )}
              <div
                className={
                  hasProfileIdentity
                    ? ""
                    : "tw-flex tw-min-h-6 tw-items-center lg:tw-min-h-7"
                }
              >
                <h1 className="tw-m-0 tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white/95 lg:tw-text-xl">
                  <span
                    className={
                      hasProfileIdentity
                        ? "tw-block tw-truncate"
                        : "tw-block tw-min-h-6 tw-max-w-full tw-truncate tw-text-sm tw-font-normal tw-leading-6"
                    }
                  >
                    {preview?.name ?? t(locale, "waves.loadingWaveUnknown")}
                  </span>
                </h1>
              </div>
              {!isDirectMessage && (
                <div
                  aria-hidden="true"
                  className="tw-hidden tw-h-6 tw-items-center md:tw-flex"
                >
                  <div className="tw-h-2 tw-w-40 tw-max-w-full tw-rounded-md tw-bg-iron-800" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {children ??
        (isError ? (
          <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-p-4 sm:tw-px-6">
            <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-400">
              {t(locale, "waves.loadingError")}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="tw-mt-4 tw-min-h-11 tw-self-start tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-medium tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {t(locale, "waves.loadingRetry")}
            </button>
          </div>
        ) : (
          <WaveChatLoading
            showHeader={false}
            showTabs={!isDirectMessage}
            status={status}
          />
        ))}
    </div>
  );
}
