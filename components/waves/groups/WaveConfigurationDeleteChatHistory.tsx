"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiWave } from "@/generated/models/ApiWave";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { useContext, useState } from "react";
import { useWaveChatHistoryPurge } from "./useWaveChatHistoryPurge";

const text = (key: Parameters<typeof waveRightPanelText>[0], params = {}) =>
  waveRightPanelText(key, params);

function DeleteChatHistory({
  waveId,
  profileId,
}: {
  readonly waveId: string;
  readonly profileId: string;
}) {
  const { setToast } = useAuth();
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const [isOpen, setIsOpen] = useState(false);
  const { state, start } = useWaveChatHistoryPurge({
    waveId,
    profileId,
    onSettled: (completed) => {
      invalidateDrops();
      if (completed) {
        setToast({
          message: text(
            "waves.sidebar.rightPanel.configuration.deleteChatHistory.success"
          ),
          type: "warning",
        });
        setIsOpen(false);
      }
    },
  });
  const busy = state.phase === "running";
  const paused = state.phase === "paused";
  const close = () => {
    if (!busy) setIsOpen(false);
  };

  return (
    <section className="tw-px-4 tw-py-4">
      <Button
        variant="tertiary"
        size="lg"
        fullWidth
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className="!tw-whitespace-normal !tw-border-red !tw-bg-black !tw-text-red active:!tw-bg-red/15 desktop-hover:hover:!tw-border-red desktop-hover:hover:!tw-bg-red/10 desktop-hover:hover:!tw-text-red"
      >
        {text(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.button"
        )}
      </Button>
      <MobileWrapperDialog
        isOpen={isOpen}
        onClose={close}
        tabletModal
        dismissible={!busy}
        title={text(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.modalTitle"
        )}
        maxWidthClass="md:tw-max-w-lg"
      >
        <div className="tw-px-4 sm:tw-px-6">
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {text(
              "waves.sidebar.rightPanel.configuration.deleteChatHistory.modalMessage"
            )}
          </p>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-300"
          >
            {busy &&
              text(
                "waves.sidebar.rightPanel.configuration.deleteChatHistory.progress",
                { count: formatInteger(DEFAULT_LOCALE, state.deletedCount) }
              )}
            {paused &&
              text(
                state.error === null
                  ? "waves.sidebar.rightPanel.configuration.deleteChatHistory.paused"
                  : "waves.sidebar.rightPanel.configuration.deleteChatHistory.confirmedProgress",
                { count: formatInteger(DEFAULT_LOCALE, state.deletedCount) }
              )}
          </div>
          {state.error !== null && (
            <p
              role="alert"
              className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-error"
            >
              {text(
                "waves.sidebar.rightPanel.configuration.deleteChatHistory.errorDescription"
              )}
            </p>
          )}
          <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-justify-end sm:tw-gap-3">
            <Button
              variant="secondary"
              size="md"
              disabled={busy}
              onClick={close}
              fullWidth
              className="sm:tw-w-auto"
            >
              {text(
                paused
                  ? "waves.sidebar.rightPanel.configuration.deleteChatHistory.close"
                  : "waves.sidebar.rightPanel.configuration.deleteChatHistory.cancel"
              )}
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={busy}
              loading={busy}
              onClick={start}
              fullWidth
              className="!tw-whitespace-normal sm:tw-w-auto"
            >
              {text(
                paused
                  ? "waves.sidebar.rightPanel.configuration.deleteChatHistory.retry"
                  : "waves.sidebar.rightPanel.configuration.deleteChatHistory.confirm"
              )}
            </Button>
          </div>
        </div>
      </MobileWrapperDialog>
    </section>
  );
}

export default function WaveConfigurationDeleteChatHistory({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const { activeProfileProxy, connectedProfile } = useAuth();
  if (!connectedProfile?.id || activeProfileProxy) return null;
  return (
    <DeleteChatHistory
      key={`${connectedProfile.id}:${wave.id}`}
      waveId={wave.id}
      profileId={connectedProfile.id}
    />
  );
}
