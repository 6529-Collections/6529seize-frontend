"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiDeleteMyWaveChatHistoryResponse } from "@/generated/models/ApiDeleteMyWaveChatHistoryResponse";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { commonApiDeleteWithResponse } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useState } from "react";

export default function WaveConfigurationDeleteChatHistory({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const { activeProfileProxy, connectedProfile, requestAuth, setToast } =
    useAuth();
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { processDropRemoved } = useMyStream();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const deleteHistoryMutation = useMutation({
    mutationFn: () =>
      commonApiDeleteWithResponse<ApiDeleteMyWaveChatHistoryResponse>({
        endpoint: `waves/${wave.id}/my-chat-history`,
      }),
    onSuccess: (response) => {
      const { deleted_drop_ids: deletedDropIds = [] } =
        response as Partial<ApiDeleteMyWaveChatHistoryResponse>;
      for (const dropId of deletedDropIds) {
        processDropRemoved(wave.id, dropId);
      }
      invalidateDrops();
      setToast({
        message: waveRightPanelText(
          deletedDropIds.length
            ? "waves.sidebar.rightPanel.configuration.deleteChatHistory.success"
            : "waves.sidebar.rightPanel.configuration.deleteChatHistory.empty"
        ),
        type: "warning",
      });
      setIsConfirmationOpen(false);
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.errorTitle"
        ),
        description: waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.errorDescription"
        ),
        details: getToastErrorDetails(error),
      });
    },
  });

  if (!connectedProfile || activeProfileProxy) {
    return null;
  }

  const deleteHistory = async () => {
    if (deleteHistoryMutation.isPending) {
      return;
    }
    const { success } = await requestAuth();
    if (success) {
      deleteHistoryMutation.mutate();
    }
  };

  return (
    <section className="tw-px-4 tw-py-4">
      <Button
        variant="tertiary"
        size="lg"
        fullWidth
        aria-haspopup="dialog"
        onClick={() => setIsConfirmationOpen(true)}
        className="!tw-whitespace-normal !tw-border-red !tw-bg-black !tw-text-red active:!tw-bg-red/15 desktop-hover:hover:!tw-border-red desktop-hover:hover:!tw-bg-red/10 desktop-hover:hover:!tw-text-red"
      >
        {waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.button"
        )}
      </Button>

      <MobileWrapperConfirmationDialog
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={deleteHistory}
        title={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.modalTitle"
        )}
        message={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.modalMessage"
        )}
        confirmText={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.confirm"
        )}
        cancelText={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.deleteChatHistory.cancel"
        )}
        isConfirming={deleteHistoryMutation.isPending}
        confirmVariant="destructive"
      />
    </section>
  );
}
