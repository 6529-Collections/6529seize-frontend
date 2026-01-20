"use client";

import { useContext, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { convertWaveToUpdateWave } from "@/helpers/waves/waves.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { multiPartUpload } from "../../create-wave/services/multiPartUpload";
import CreateWaveImageInput from "../../create-wave/overview/CreateWaveImageInput";

export default function WaveHeaderPictureEditModal({
  wave,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);

  const [file, setFile] = useState<File | null>(null);
  const [mutating, setMutating] = useState(false);
  const isDisabled = mutating || !file;

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
        message: "Failed to authenticate",
      });
      setMutating(false);
      return;
    }

    try {
      const uploaded = await multiPartUpload({ file, path: "wave" });
      const body = {
        ...convertWaveToUpdateWave(wave),
        picture: uploaded.url,
      };
      await editPictureMutation.mutateAsync(body);
    } catch (error) {
      setToast({
        type: "error",
        message: (error as any)?.message ?? "Failed to update wave picture",
      });
      setMutating(false);
    }
  };

  return createPortal(
    <div className="tw-relative tw-z-50">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-2 tw-text-center sm:tw-items-center lg:tw-p-0">
          <div
            ref={modalRef}
            className="tw-relative tw-w-full tw-max-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full md:tw-max-w-xl lg:tw-p-8"
          >
            <form
              onSubmit={onSubmit}
              className="tw-flex tw-flex-col tw-gap-y-6"
            >
              <div>
                <p className="tw-mb-1 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
                  Update wave picture
                </p>
                <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                  Upload a new image (JPG, JPEG, PNG, GIF, WEBP — max 10MB).
                </p>
              </div>

              <CreateWaveImageInput
                imageToShow={file}
                setFile={setFile}
                allowRemove={false}
              />

              <div className="tw-flex tw-justify-end tw-gap-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-800 sm:tw-w-auto"
                >
                  Cancel
                </button>
                <button
                  disabled={isDisabled}
                  type="submit"
                  className={`tw-relative tw-flex tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-transition tw-duration-300 tw-ease-out sm:tw-w-auto ${
                    isDisabled
                      ? "tw-cursor-not-allowed tw-border-iron-800 tw-bg-iron-800 tw-text-iron-500"
                      : "tw-cursor-pointer tw-border-primary-500 tw-bg-primary-500 tw-text-white hover:tw-border-primary-600 hover:tw-bg-primary-600"
                  }`}
                >
                  <div style={{ visibility: mutating ? "hidden" : "visible" }}>
                    Save
                  </div>
                  {mutating && (
                    <>
                      <span className="tw-sr-only">Uploading…</span>
                      <svg
                        role="output"
                        aria-label="Uploading"
                        className="tw-absolute tw-inline tw-h-5 tw-w-5 tw-animate-spin tw-text-primary-400"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className="tw-text-iron-600"
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
