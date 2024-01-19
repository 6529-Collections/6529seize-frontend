import { UserPageStatsTableItemData } from "./UserPageStatsTable";

export default function UserPageStatsTableRow({
  data,
}: {
  readonly data: UserPageStatsTableItemData;
}) {
  const mainClasses = data.isMain
    ? "tw-pt-2.5 tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-700"
    : "tw-text-iron-500";

  const lastClasses = data.isLast ? "tw-pb-2.5" : "";

  const classes = `${mainClasses} ${lastClasses}`;
  return (
    <>
      <td
        className={`${classes} tw-font-medium tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base`}
      >
        {data.title}
      </td>

      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.total}
      </td>
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.memes}
      </td>
      {/* TODO: make SZN type safe */}
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.SZN1}
      </td>
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.SZN2}
      </td>
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.SZN3}
      </td>
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.SZN4}
      </td>
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.SZN5}
      </td>
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.SZN6}
      </td>
      <td
        className={`${classes} tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right`}
      >
        {data.gradient}
      </td>
    </>
  );
}
