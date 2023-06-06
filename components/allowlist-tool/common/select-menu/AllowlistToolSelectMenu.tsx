export interface AllowlistToolSelectMenuOption {
  title: string;
  subTitle: string | null;
  value: string;
}

export default function AllowlistToolSelectMenu({
  label,
  options,
}: {
  label: string;
  options: AllowlistToolSelectMenuOption[];
}) {
  return (
    <div>
      <label
        id="listbox-label"
        className="tw-block tw-text-sm tw-font-medium tw-leading-6 text-text-neutral-900"
      >
        {label}
      </label>
      <div className="tw-relative tw-mt-2">
        <button
          type="button"
          className="tw-relative tw-w-full tw-cursor-default tw-rounded-md tw-bg-white tw-py-1.5 tw-pl-3 tw-pr-10 tw-text-left text-text-neutral-900 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-gray-300 tw-focus:tw-outline-none tw-focus:tw-ring-2 tw-focus:tw-ring-indigo-500 tw-sm:tw-text-sm tw-sm:tw-leading-6"
          aria-haspopup="listbox"
          aria-expanded="true"
          aria-labelledby="listbox-label"
        >
          <span className="tw-inline-flex tw-w-full tw-truncate">
            <span className="tw-truncate">Tom Cook</span>
            <span className="tw-ml-2 tw-truncate text-text-neutral-500">
              @tomcook
            </span>
          </span>
          <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-2">
            <svg
              className="tw-h-5 tw-w-5 text-text-neutral-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>
        <ul
          className="tw-absolute tw-z-10 tw-mt-1 tw-max-h-60 tw-w-full tw-overflow-auto tw-rounded-md tw-bg-white tw-py-1 tw-text-base tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 tw-focus:tw-outline-none tw-sm:tw-text-sm"
          tabIndex={-1}
          role="listbox"
          aria-labelledby="listbox-label"
          aria-activedescendant="listbox-option-3"
        >
          {options.map((option) => (
            <li
              key={option.value}
              className="text-text-neutral-900 tw-relative tw-cursor-default tw-select-none tw-py-2 tw-pl-3 tw-pr-9"
              id="listbox-option-0"
              role="option"
              aria-selected="true"
            >
              <div className="tw-flex">
                <span className="tw-font-normal tw-truncate">{option.title}</span>
                <span className="text-text-neutral-500 tw-ml-2 tw-truncate">
                  {option.subTitle}
                </span>
              </div>

              <span className="tw-text-indigo-600 tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-4">
                <svg
                  className="tw-h-5 tw-w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
