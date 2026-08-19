"use client";

import { useContext, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { convertWaveToUpdateWave } from "@/helpers/waves/waves.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import { multiPartUpload } from "../../create-wave/services/multiPartUpload";
import CreateWaveImageInput from "../../create-wave/overview/CreateWaveImageInput";
import Button from "@/components/utils/button/Button";

export default function WaveHeaderPictureEditModal({
  isOpen,
  wave,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onClose: () => void;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const locale = useBrowserLocale();

  const [file, setFile] = useState<File | null>(null);
  const [mutating, setMutating] = useState(false);

  const editPictureMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveRequest) =>
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
      onClose();
    },
    onError: (error) => {
      let message: string;
      if (error instanceof Error && error.message) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      } else if (typeof error.message === "string") {
        message = error.message;
      } else {
        try {
          message = JSON.stringify(error);
        } catch {
          message = "Failed to update wave picture";
        }
      }
      setToast({
        type: "error",
        message,
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        type: "error",
        message: "Couldn't authenticate. Reconnect your wallet and try again.",
      });
      setMutating(false);
      return;
    }

    let uploaded: Awaited<ReturnType<typeof multiPartUpload>>;
    try {
      uploaded = await multiPartUpload({ file, path: "wave" });
    } catch (error) {
      setToast({
        type: "error",
        title: "Couldn't update the wave picture.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
      setMutating(false);
      return;
    }

    const body = {
      ...convertWaveToUpdateWave(wave),
      picture: uploaded.url,
    };

    try {
      await editPictureMutation.mutateAsync(body);
    } catch {
      // editPictureMutation.onError owns the toast for API failures.
    }
  };

  return (
    <MobileWrapperDialog
      title={t(locale, "waves.header.pictureEditTitle")}
      isOpen={isOpen}
      onClose={onClose}
      onAfterLeave={() => setFile(null)}
      tabletModal
      showHeaderCloseButton
      showScrollbar
      maxWidthClass="md:tw-max-w-xl"
      zIndexClassName="tw-z-[9999]"
      headerClassName="-tw-mt-2 tw-pb-4 md:tw-mt-0"
    >
      <form onSubmit={onSubmit} className="tw-px-4 sm:tw-px-6">
        <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "waves.header.pictureEditDescription")}
        </p>

        <div className="tw-mt-5">
          <CreateWaveImageInput
            imageToShow={file}
            setFile={setFile}
            allowRemove={false}
          />
        </div>

        <div className="tw-flex tw-flex-col tw-gap-2 tw-pt-5 md:tw-flex-row-reverse md:tw-justify-start">
          <Button
            disabled={!file}
            loading={mutating}
            type="submit"
            variant="action"
            size="lg"
            fullWidth
            className="md:tw-w-auto"
          >
            {t(locale, "waves.header.pictureEditSave")}
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            size="lg"
            fullWidth
            className="tw-hidden md:tw-inline-flex md:tw-w-auto"
          >
            {t(locale, "waves.header.pictureEditCancel")}
          </Button>
        </div>
      </form>
    </MobileWrapperDialog>
  );
}
