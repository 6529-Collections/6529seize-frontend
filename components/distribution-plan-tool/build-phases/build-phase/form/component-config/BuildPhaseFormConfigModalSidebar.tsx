export interface BuildPhaseFormConfigModalSidebarOption {
  readonly label: string;
  readonly value: string;
}
export default function BuildPhaseFormConfigModalSidebar({
  label,
  options,
  selectedOption,
  setSelectedOption,
}: {
  label: string,
  options: BuildPhaseFormConfigModalSidebarOption[];
  selectedOption: string | null;
  setSelectedOption: (option: string) => void;
}) {
  const selectionActiveClasses =
    "tw-bg-neutral-800 tw-text-white tw-cursor-pointer tw-whitespace-nowrap tw-no-underline tw-group tw-flex tw-gap-x-3 tw-rounded-md tw-py-2 tw-px-3 tw-text-sm tw-leading-6 tw-font-medium tw-transition tw-duration-300 tw-ease-out";
  const selectionInactiveClasses =
    "tw-whitespace-nowrap tw-text-neutral-500 tw-cursor-pointer tw-no-underline hover:tw-text-neutral-100 hover:tw-bg-neutral-900 tw-group tw-flex tw-gap-x-3 tw-rounded-md tw-py-2 tw-px-3 tw-text-sm tw-leading-6 tw-font-medium tw-transition tw-duration-300 tw-ease-out";

  return (
    <nav className="tw-w-auto tw-mt-2" aria-label="Sidebar">
      <div className="tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
        {label}
      </div>
      <ul role="list" className="tw-list-none tw-mx-0 tw-mt-2 tw-mb-0 tw-p-0 tw-space-y-1">
        {options.map((option) => (
          <li
            key={option.value}
            onClick={() => setSelectedOption(option.value)}
            className={
              selectedOption === option.value
                ? selectionActiveClasses
                : selectionInactiveClasses
            }
          >
            {option.label}
          </li>
        ))}
      </ul>
    </nav>
  );
}
