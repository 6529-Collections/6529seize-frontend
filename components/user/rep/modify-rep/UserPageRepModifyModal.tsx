import { useContext, useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "../../../auth/Auth";
import { commonApiPost } from "../../../../services/api/common-api";

interface ApiAddRepRatingToProfileRequest {
  readonly amount: number;
  readonly category: string;
}

export default function UserPageRepModifyModal({
  onClose,
  profile,
  repName,
}: {
  readonly onClose: () => void;
  readonly profile: IProfileAndConsolidations;
  readonly repName: string;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [value, setValue] = useState<string>("");
  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const addRepMutation = useMutation({
    mutationFn: async ({
      amount,
      category,
    }: {
      amount: number;
      category: string;
    }) =>
      await commonApiPost<ApiAddRepRatingToProfileRequest, void>({
        endpoint: `profiles/${profile.profile?.handle}/rep/rating`,
        body: {
          amount,
          category,
        },
      }),
    onSuccess: () => {
      setToast({
        message: "Rep added.",
        type: "success",
      });
    },
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value) return;
    if (!repName) return;
    const { success } = await requestAuth();
    if (!success) return;
    await addRepMutation.mutateAsync({
      amount: parseInt(value),
      category: repName,
    });
  };

  return (
    <div className="tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-4xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-900 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6"
          >
            <form onSubmit={onSubmit}>
              <input
                ref={inputRef}
                type="text"
                required
                autoComplete="off"
                value={value}
                onChange={onValueChange}
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-10 tw-pr-3 tw-bg-white/5 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/10 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-300 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />

              <div className="tw-mt-8">
                <div className="sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
                  <button
                    type="submit"
                    className="tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
                  >
                    Save
                  </button>
                  <button
                    onClick={onClose}
                    type="button"
                    className="tw-mt-3 sm:tw-mt-0 tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-iron-600 tw-rounded-lg hover:tw-bg-iron-800 hover:tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out"
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
