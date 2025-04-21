export default function GroupCreateName({
  name,
  setName,
}: {
  readonly name: string;
  readonly setName: (name: string) => void;
}) {
  return (
    <div className="tw:p-3 sm:tw:p-5 tw:bg-iron-950 tw:rounded-xl tw:shadow tw:border tw:border-solid tw:border-iron-800">
      <div className="tw:group tw:w-full tw:relative">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          id="floating_name"
          autoComplete="off"
          className="tw:form-input tw:block tw:pb-3 tw:pt-3 tw:px-4 tw:w-full tw:text-md tw:rounded-lg tw:border-0 tw:appearance-none tw:text-white tw:border-iron-700 tw:focus:border-blue-500 tw:peer
      tw:bg-iron-900 tw:focus:bg-iron-900 tw:font-medium tw:caret-primary-300 tw:shadow-sm tw:ring-1 tw:ring-inset tw:ring-iron-700 tw:hover:ring-iron-650 tw:placeholder:text-iron-500 tw:focus:outline-none tw:focus:ring-1 tw:focus:ring-inset tw:focus:ring-primary-400 tw:transition tw:duration-300 tw:ease-out"
          placeholder=" "
        />
        <label
          htmlFor="floating_name"
          className="tw:absolute tw:cursor-text tw:text-md tw:font-medium tw:text-iron-500 tw:duration-300 tw:transform -tw:translate-y-4 tw:scale-75 tw:top-2 tw:z-10 tw:origin-[0] tw:bg-iron-900 tw:peer-focus:bg-iron-900 tw:px-2 tw:peer-focus:px-2 tw:peer-focus:text-primary-400 tw:peer-placeholder-shown:scale-100 tw:rounded-lg
  tw:peer-placeholder-shown:-translate-y-1/2 tw:peer-placeholder-shown:top-1/2 tw:peer-focus:top-2 tw:peer-focus:scale-75 tw:peer-focus:-translate-y-4 tw:rtl:peer-focus:translate-x-1/4 tw:rtl:peer-focus:left-auto tw:start-1"
        >
          Name
        </label>
      </div>
    </div>
  );
}
