import styles from "./UserPageStats.module.scss";

export function UserPageStatsTableHead() {
  return (
    <thead>
      <tr>
        <th></th>
        <th className="text-right">Total</th>
        <th className="text-right">Memes</th>
        <th className="text-right">NextGen</th>
        <th className="text-right">Gradient</th>
        <th className="text-right">Meme Lab</th>
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
        <hr className="mb-1 mt-1" />
      </td>
    </tr>
  );
}
