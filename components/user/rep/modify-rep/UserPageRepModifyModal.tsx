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
            className="sm:tw-max-w-md tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-900 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6"
          >
            <div className="tw-flex tw-justify-between">
              <div className="tw-max-w-xl sm:tw-flex tw-items-center sm:tw-space-x-4">
                <div>
                  <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-700/60 tw-border tw-border-solid tw-border-iron-600/20">
                    <svg
                      className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
                      clip-rule="evenodd"
                      fill-rule="evenodd"
                      height="512"
                      stroke-linejoin="round"
                      stroke-miterlimit="2"
                      viewBox="0 0 32 32"
                      width="512"
                      xmlns="http://www.w3.org/2000/svg"
                      id="fi_4803084"
                    >
                      <path
                        fill="currentColor"
                        d="m15.628 2c-3.864 0-7 3.137-7 7s3.136 7 7 7c3.863 0 7-3.137 7-7s-3.137-7-7-7zm0 2c2.759 0 5 2.24 5 5s-2.241 5-5 5c-2.76 0-5-2.24-5-5s2.24-5 5-5z"
                      ></path>
                      <path
                        fill="currentColor"
                        d="m3.628 28h12.372c.552 0 1 .448 1 1s-.448 1-1 1h-13.372c-.553 0-1-.448-1-1 0 0 0-.825 0-2 0-4.971 4.029-9 9-9h5.377c.552 0 1 .448 1 1s-.448 1-1 1h-5.377c-3.866 0-7 3.134-7 7z"
                      ></path>
                      <path
                        fill="currentColor"
                        d="m21.917 20.108 1.725-3.332c.172-.332.515-.54.888-.54.374 0 .717.208.888.54l1.726 3.332 3.702.612c.369.061.673.322.788.677.116.356.024.746-.239 1.012l-2.636 2.671.563 3.71c.056.369-.099.739-.401.959-.302.219-.702.252-1.036.085l-3.355-1.682-3.354 1.682c-.334.167-.734.134-1.036-.085-.302-.22-.457-.59-.401-.959l.562-3.71-2.635-2.671c-.263-.266-.355-.656-.24-1.012.116-.355.42-.616.789-.677zm2.613-.698-1.068 2.063c-.145.28-.414.475-.725.527l-2.291.378 1.631 1.654c.222.224.324.54.277.852l-.348 2.296 2.076-1.04c.282-.142.615-.142.897 0l2.076 1.04-.348-2.296c-.047-.312.055-.628.277-.852l1.631-1.654-2.291-.378c-.312-.052-.58-.247-.725-.527z"
                      ></path>
                    </svg>
                  </span>
                </div>
                <p className="tw-mt-3 sm:tw-mt-0 tw-whitespace-wrap md:tw-max-w-sm tw-text-lg tw-text-iron-50 tw-font-medium tw-mb-0">
                  Add Rep
                </p>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 sm:tw-top-6 tw-flex tw-justify-between tw-items-center">
                <button
                  onClick={onClose}
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
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
            <div className="tw-mt-8">
              <div className="tw-flex tw-flex-col tw-space-y-1">
                <span className="tw-text-sm tw-block tw-text-iron-200 tw-font-semibold">
                  <span>Your available Rep:</span>
                  <span className="tw-ml-1">123</span>
                </span>
                <span className="tw-text-sm tw-block tw-text-iron-200 tw-font-semibold">
                  <span>Your max/min Rep Rating to GelatoGenesis:</span>
                  <span className="tw-ml-1">+/- 12,341</span>
                </span>
              </div>
            </div>
            <form onSubmit={onSubmit} className="tw-mt-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400">
                  Add rep to Cool Guy
                </label>
                <div className="tw-relative tw-flex tw-mt-1.5">
                  <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-iron-900 tw-rounded-l-lg tw-border tw-border-solid tw-border-iron-700 tw-px-3">
                    <svg
                      className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <svg
                      className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 12H19"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    autoComplete="off"
                    value={value}
                    onChange={onValueChange}
                    className="-tw-ml-0.5 tw-block tw-w-full tw-rounded-r-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 tw-text-iron-300 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none  focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
                <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-y-1 tw-gap-x-4">
                  <div className="tw-space-x-1.5">
                    <span className="tw-text-sm tw-text-iron-200 tw-font-medium">
                      Current Rep:
                    </span>
                    <span className="tw-text-sm tw-font-semibold">123</span>
                  </div>
                  <div className="tw-space-x-1.5">
                    <span className="tw-text-sm tw-text-iron-200 tw-font-medium">
                      Adjustment:
                    </span>
                    <span className="tw-text-sm tw-font-semibold">0</span>
                  </div>
                </div>
              </div>

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
