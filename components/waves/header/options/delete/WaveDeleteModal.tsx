"use client";

import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiDelete } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

export default function WaveDeleteModal({
  wave,
  isOpen,
  closeModal,
}: {
  readonly wave: ApiWave;
  readonly isOpen: boolean;
  readonly closeModal: () => void;
}) {
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const router = useRouter();
  const [mutating, setMutating] = useState(false);

  const waveDropMutation = useMutation({
    mutationFn: async () =>
      await commonApiDelete({
        endpoint: `waves/${wave.id}`,
      }),
    onSuccess: () => {
      setToast({
        message: t(locale, "waves.header.deleteSuccess"),
        type: "warning",
      });
      invalidateDrops();
      router.push("/waves");
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "waves.header.deleteErrorTitle"),
        description: t(locale, "waves.header.deleteErrorDescription"),
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onDelete = async () => {
    if (mutating) {
      return;
    }

    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }

    waveDropMutation.mutate();
  };

  return (
    <MobileWrapperDialog
      title={t(locale, "waves.header.deleteTitle")}
      isOpen={isOpen}
      onClose={closeModal}
      tabletModal
      showHeaderCloseButton
      maxWidthClass="md:tw-max-w-md"
      dismissible={!mutating}
    >
      <div className="tw-px-4 sm:tw-px-6">
        <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "waves.header.deleteDescription")}
        </p>
        <div className="tw-mt-6 tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
          <Button
            disabled={mutating}
            onClick={closeModal}
            variant="secondary"
            size="lg"
            fullWidth
            className="sm:tw-w-auto"
          >
            {t(locale, "waves.header.deleteCancel")}
          </Button>
          <Button
            disabled={mutating}
            loading={mutating}
            onClick={() => void onDelete()}
            variant="destructive"
            size="lg"
            fullWidth
            className="sm:tw-w-auto"
          >
            {t(locale, "waves.header.ownerOptionsDelete")}
          </Button>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
