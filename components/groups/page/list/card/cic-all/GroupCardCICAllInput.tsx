export default function GroupCardCICAllInput({
  cicToGive,
  setCicToGive,
}: {
  readonly cicToGive: number | null;
  readonly setCicToGive: (cicToGive: number | null) => void;
}) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setCicToGive(null);
      return;
    }
    const numberCIC = parseInt(value);
    if (isNaN(numberCIC)) {
      setCicToGive(null);
      return;
    }
    setCicToGive(numberCIC);
  };
  return (
    <div className="tw-w-full xl:tw-max-w-[17.156rem]">
      <div className="tw-group tw-w-full tw-relative">
        <input
          type="number"
          id="floating_cic_number"
          value={cicToGive ?? ""}
          onChange={onChange}
          autoComplete="off"
          className="tw-form-input tw-block tw-py-3 tw-text-sm tw-px-4 tw-w-full tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
          placeholder=" "
        />
        <label
          htmlFor="floating_cic_number"
          className="tw-absolute tw-cursor-text tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-[1] tw-origin-[0] tw-bg-iron-900 tw-rounded-lg group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
        >
          CIC
        </label>
      </div>
    </div>
  );
}
