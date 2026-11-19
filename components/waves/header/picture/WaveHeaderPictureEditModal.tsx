"use client";

import { useContext, useLayoutEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveHubRequest } from "@/generated/models/ApiUpdateWaveHubRequest";
import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { updateWaveHub } from "@/services/api/wave-hub-api";
import { multiPartUpload } from "../../create-wave/services/multiPartUpload";
import CreateWaveImageInput from "../../create-wave/overview/CreateWaveImageInput";
import Button from "@/components/utils/button/Button";

function getPictureUpdateErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  )
    return error.message;
  if (error === undefined) return "Failed to update wave picture";
  try {
    return JSON.stringify(error);
  } catch {
    return "Failed to update wave picture";
  }
}

export default function WaveHeaderPictureEditModal({
  isOpen,
  wave,
  onClose,
  embedded = false,
}: {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onClose: () => void;
  readonly embedded?: boolean;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const locale = useBrowserLocale();

  const [file, setFile] = useState<File | null>(null);
  const [mutating, setMutating] = useState(false);

  const submission = useRef<AbortController | null>(null);
  useLayoutEffect(() => {
    if (!isOpen) submission.current?.abort();
    return () => submission.current?.abort();
  }, [isOpen]);

  const editPictureMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveHubRequest) =>
      await updateWaveHub(wave.id, body),
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    submission.current?.abort();
    const controller = new AbortController();
    submission.current = controller;
    const isCurrent = () =>
      submission.current === controller && !controller.signal.aborted;
    setMutating(true);
    try {
      const { success } = await requestAuth();
      if (!isCurrent()) return;
      if (!success) {
        setToast({
          type: "error",
          message:
            "Couldn't authenticate. Reconnect your wallet and try again.",
        });
        return;
      }

      let uploaded: Awaited<ReturnType<typeof multiPartUpload>>;
      try {
        uploaded = await multiPartUpload({
          file,
          path: "wave",
          signal: controller.signal,
        });
      } catch (error) {
        if (isCurrent())
          setToast({
            type: "error",
            title: "Couldn't update the wave picture.",
            description: "Please try again.",
            details: getToastErrorDetails(error),
          });
        return;
      }
      // Back/Close can unmount this form while an upload is pending. A stale
      // upload must never overwrite a picture saved by a reopened editor.
      if (!isCurrent()) return;
      try {
        await editPictureMutation.mutateAsync({ picture: uploaded.url });
        onWaveCreated();
        if (isCurrent()) onClose();
      } catch (error) {
        if (!isCurrent()) return;
        setToast({
          type: "error",
          message: getPictureUpdateErrorMessage(error),
        });
      }
    } finally {
      if (submission.current === controller) {
        submission.current = null;
        setMutating(false);
      }
    }
  };

  const form = (
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
  );

  if (embedded) return isOpen ? form : null;

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
      {form}
    </MobileWrapperDialog>
  );
}
