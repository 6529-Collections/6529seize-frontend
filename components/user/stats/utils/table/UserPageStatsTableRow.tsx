import { UserPageStatsTableItemData } from "./UserPageStatsTable";

export default function UserPageStatsTableRow({
  data,
}: {
  readonly data: UserPageStatsTableItemData;
}) {
  const classes = data.isMain ? "" : "tw-text-neutral-400";
  return (
    <>
      <div className={`${classes} tw-col-span-2`}>{data.title}</div>
      <div className={`${classes} w-col-span-1`}>{data.total}</div>
      <div className={`${classes} w-col-span-1`}>{data.memes}</div>
      {/* TODO: make SZN type safe */}
      <div className={`${classes} w-col-span-1`}>{data.SZN1}</div>
      <div className={`${classes} w-col-span-1`}>{data.SZN2}</div>
      <div className={`${classes} w-col-span-1`}>{data.SZN3}</div>
      <div className={`${classes} w-col-span-1`}>{data.SZN4}</div>
      <div className={`${classes} w-col-span-1`}>{data.SZN5}</div>
      <div className={`${classes} w-col-span-1`}>{data.SZN6}</div>
      <div className={`${classes} w-col-span-1`}>{data.gradient}</div>
    </>
  );
}
