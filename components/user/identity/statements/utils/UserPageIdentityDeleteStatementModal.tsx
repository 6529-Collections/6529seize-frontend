import { useContext, useRef } from "react";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import { useClickAway, useKeyPressEvent } from "react-use";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../../../../auth/Auth";
import { commonApiDelete } from "../../../../../services/api/common-api";

export default function UserPageIdentityDeleteStatementModal({
  statement,
  profile,
  onClose,
}: {
  statement: CicStatement;
  profile: IProfileAndConsolidations;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);
  
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useContext(AuthContext);

  const deleteStatementMutation = useMutation({
    mutationFn: async () =>
      await commonApiDelete({
        endpoint: `profiles/${profile.profile?.handle}/cic/statements/${statement.id}`,
      }),
    onSuccess: () => {
      setToast({
        message: "CIC statement deleted.",
        type: "warning",
      });
      queryClient.invalidateQueries({
        queryKey: ["user-cic-statements", profile.profile?.handle],
      });
      for (const wallet of profile.consolidation.wallets) {
        queryClient.invalidateQueries({
          queryKey: [
            "user-cic-statements",
            wallet.wallet.address.toLowerCase(),
          ],
        });

        if (wallet.wallet.ens) {
          queryClient.invalidateQueries({
            queryKey: ["user-cic-statements", wallet.wallet.ens.toLowerCase()],
          });
        }
      }
    },
  });

  const onDelete = async () => {
    const { success } = await requestAuth();
    if (!success) return;
    await deleteStatementMutation.mutateAsync();
  };

  return (
    <div className="tw-cursor-default tw-relative tw-z-10" role="dialog">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-neutral-900 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6"
          >
            <div className="tw-flex tw-justify-between">
              <div className="tw-max-w-xl tw-flex tw-space-x-4">
                <div>
                  <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-red/10 tw-border tw-border-solid tw-border-red/10">
                    <svg
                      className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-red tw-transition tw-duration-300 tw-ease-out"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
                <div className="tw-max-w-sm tw-flex tw-flex-col">
                  <p className=" tw-text-lg tw-text-neutral-50 tw-font-medium tw-mb-0">
                    Delete Statement
                  </p>
                  <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-text-neutral-400">
                    Are you sure you want to delete this statement? This action
                    cannot be undone.
                  </p>
                </div>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-justify-between tw-items-center">
                <button
                  onClick={onClose}
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="tw-sr-only tw-text-sm">Close</span>
                  <svg
                    className="tw-h-6 tw-w-6"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
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
                    onClick={onDelete}
                    type="button"
                    className="tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-[#F04438] tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-[#F04438] tw-rounded-lg hover:tw-bg-[#D92D20] hover:tw-border-[#D92D20] tw-transition tw-duration-300 tw-ease-out"
                  >
                    Delete
                  </button>
                  <button
                    onClick={onClose}
                    type="button"
                    className="tw-mt-3 sm:tw-mt-0 tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-neutral-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-neutral-600 tw-rounded-lg hover:tw-bg-neutral-800 hover:tw-border-neutral-700 tw-transition tw-duration-300 tw-ease-out"
                  >
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
