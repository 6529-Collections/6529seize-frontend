"use client";

import { useContext, useRef, useState } from "react";
import { CicStatement } from "@/entities/IProfile";
import { useClickAway, useKeyPressEvent } from "react-use";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { commonApiDelete } from "@/services/api/common-api";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
export default function UserPageIdentityDeleteStatementModal({
  statement,
  profile,
  onClose,
}: {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const { requestAuth, setToast } = useContext(AuthContext);
  const { onProfileStatementRemove } = useContext(ReactQueryWrapperContext);
  const [loading, setLoading] = useState(false);

  const deleteStatementMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      return await commonApiDelete({
        endpoint: `profiles/${profile.query}/cic/statements/${statement.id}`,
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSuccess: () => {
      setToast({
        message: "NIC statement deleted.",
        type: "warning",
      });
      onProfileStatementRemove({ profile });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const onDelete = async () => {
    const { success } = await requestAuth();
    if (!success) return;
    await deleteStatementMutation.mutateAsync();
  };

  return (
    <div className="tw-cursor-default tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6">
            <div className="tw-flex tw-justify-between">
              <div className="tw-max-w-xl sm:tw-flex sm:tw-space-x-4">
                <div>
                  <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-red/10 tw-border tw-border-solid tw-border-red/10">
                    <svg
                      className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-red tw-transition tw-duration-300 tw-ease-out"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M10 11.5V16.5M14 11.5V16.5M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <div className="tw-mt-3 sm:tw-mt-0 sm:tw-max-w-sm tw-flex tw-flex-col">
                  <p className=" tw-text-lg tw-text-iron-50 tw-font-medium tw-mb-0">
                    Delete Statement
                  </p>
                  <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-text-iron-400">
                    Are you sure you want to delete this statement?
                  </p>
                </div>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-justify-between tw-items-center">
                <button
                  onClick={onClose}
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out">
                  <span className="tw-sr-only tw-text-sm">Close</span>
                  <svg
                    className="tw-h-6 tw-w-6"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <form>
              <div className="tw-mt-8">
                <div className="sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
                  <button
                    disabled={loading}
                    onClick={onDelete}
                    type="button"
                    className={`tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-justify-center tw-relative  tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out ${
                      loading
                        ? "tw-cursor-not-allowed tw-bg-iron-400 tw-border-iron-400"
                        : "tw-cursor-pointer tw-bg-[#F04438] tw-border-[#F04438] hover:tw-bg-[#D92D20] hover:tw-border-[#D92D20]"
                    }`}>
                    <div style={{ visibility: loading ? "hidden" : "visible" }}>
                      Delete
                    </div>
                    {loading && (
                      <svg
                        aria-hidden="true"
                        role="output"
                        className="tw-inline tw-w-5 tw-h-5 tw-text-[#F04438] tw-animate-spin tw-absolute"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          className="tw-text-neutral-600"
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"></path>
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentColor"></path>
                      </svg>
                    )}
                  </button>
                  <button
                    disabled={loading}
                    onClick={onClose}
                    type="button"
                    className={`tw-mt-3 sm:tw-mt-0 tw-w-full sm:tw-w-auto tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out ${
                      loading
                        ? "tw-cursor-not-allowed"
                        : "hover:tw-bg-iron-800 hover:tw-border-iron-700"
                    }`}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
