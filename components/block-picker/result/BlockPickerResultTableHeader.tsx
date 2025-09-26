export default function BlockPickerResultTableHeader() {
  return (
    <thead className="tw-bg-neutral-800/60">
      <tr>
        <th
          scope="col"
          className="tw-py-3 tw-px-4 tw-text-center tw-whitespace-nowrap tw-w-px tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
          Block includes
        </th>
        <th
          scope="col"
          className="tw-py-3 tw-px-4 tw-text-center tw-whitespace-nowrap tw-w-px tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
          Count
        </th>
        <th
          scope="col"
          className="tw-py-3 tw-px-4 tw-text-left tw-w-full tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
          Blocks
        </th>
        <th
          scope="col"
          className="tw-py-3 tw-px-4 tw-text-center tw-whitespace-nowrap tw-w-[28px] tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
          {/* Focus (icon) */}
        </th>
      </tr>
    </thead>
  );
}
