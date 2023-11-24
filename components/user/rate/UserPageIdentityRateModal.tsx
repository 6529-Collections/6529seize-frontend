import { FormEvent, useContext, useState } from "react";
import CommonModalWrapper, {
  CommonModalWrapperSize,
} from "../../utils/modal/CommonModalWrapper";
import { AuthContext } from "../../auth/Auth";
import { commonApiPost } from "../../../services/api/common-api";

export default function UserPageIdentityRateModal({
  isModalOpen,
  setIsModalOpen,
  targetHandle,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  targetHandle: string;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const [value, setValue] = useState("0");

  const onSave = async () => {
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "You must be logged in.",
        type: "error",
      });
      return;
    }

    if (value === "") {
      setToast({
        message: "You must enter a value.",
        type: "error",
      });
      return;
    }

    if (isNaN(Number(value))) {
      setToast({
        message: "You must enter a number.",
        type: "error",
      });
      return;
    }

    const updatedTargetProfile = await commonApiPost({
      endpoint: `profiles/${targetHandle}/cic/rating`,
      body: {
        amount: Number(value),
      },
    });

    console.log(updatedTargetProfile);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value;
    if (/^-?\d*$/.test(inputValue)) {
      setValue(inputValue);
    }
  };

  return (
    <CommonModalWrapper
      showModal={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      modalSize={CommonModalWrapperSize.X_LARGE}
    >
      <div className="tw-p-6">
        <p className="tw-max-w-sm tw-text-lg tw-text-white tw-font-medium tw-mb-0">
          rate things
        </p>

        <div>
          <form onSubmit={onSubmit}>
            <input
              type="text"
              value={value}
              onChange={handleChange}
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-neutral-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
            />
            <button type="submit">Save</button>
          </form>
        </div>
      </div>
    </CommonModalWrapper>
  );
}
