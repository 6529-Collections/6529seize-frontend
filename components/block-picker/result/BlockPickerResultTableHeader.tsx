export default function BlockPickerResultTableHeader() {
  return (
    <thead className="tw-bg-neutral-800/60">
      <tr>
        <th
          scope="col"
          className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
        >
          Block includes
        </th>
        <th
          scope="col"
          className="tw-py-3 tw-pr-4 tw-pl-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pr-6"
        >
          Count
        </th>
        <th
          scope="col"
          className="tw-py-3 tw-pr-4 tw-pl-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pr-6"
        ></th>
      </tr>
    </thead>
  );
}
