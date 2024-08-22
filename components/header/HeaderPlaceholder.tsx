import useIsCapacitor from "../../hooks/isCapacitor";
import styles from "./Header.module.scss";

export default function HeaderPlaceholder() {
  const isCapacitor = useIsCapacitor();
  return (
    <div
      className={
        isCapacitor
          ? styles.headerPlaceholderCapacitor
          : styles.headerPlaceholder
      }></div>
  );
}
