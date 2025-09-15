import styles from "./UserPageStats.module.scss";

export function UserPageStatsTableHead() {
  return (
    <thead>
      <tr>
        <th></th>
        <th className="text-right !tw-text-[#93939f]">Total</th>
        <th className="text-right !tw-text-[#93939f]">Memes</th>
        <th className="text-right !tw-text-[#93939f]">NextGen</th>
        <th className="text-right !tw-text-[#93939f]">Gradient</th>
        <th className="text-right !tw-text-[#93939f]">Meme Lab</th>
      </tr>
    </thead>
  );
}

export function UserPageStatsTableHr(
  props: Readonly<{
    span: number;
  }>
) {
  return (
    <tr>
      <td colSpan={props.span} className={styles.collectedAccordionTableHr}>
        <hr className="mb-1 mt-1 tw-border-[#93939f]" />
      </td>
    </tr>
  );
}
