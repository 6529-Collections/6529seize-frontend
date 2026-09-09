export default function BlockPickerResultTableHeader() {
  return (
    <thead className="tw-bg-iron-900/70">
      <tr>
        <th
          scope="col"
          className="tw-w-px tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-[1.125rem] tw-tracking-[0.25px] tw-text-iron-400"
        >
          Block includes
        </th>
        <th
          scope="col"
          className="tw-w-px tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-[1.125rem] tw-tracking-[0.25px] tw-text-iron-400"
        >
          Count
        </th>
        <th
          scope="col"
          className="tw-w-full tw-px-4 tw-py-3 tw-text-left tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-[1.125rem] tw-tracking-[0.25px] tw-text-iron-400"
        >
          Blocks
        </th>
        <th
          scope="col"
          className="tw-w-[28px] tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-[1.125rem] tw-tracking-[0.25px] tw-text-iron-400"
        >
          {/* Focus (icon) */}
        </th>
      </tr>
    </thead>
  );
}
