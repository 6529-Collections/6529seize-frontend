import useCapacitor from "@/hooks/useCapacitor";
import styles from "./Header.module.scss";

export default function HeaderPlaceholder() {
const capacitor = useCapacitor();

  return (
    <div
      className={
        capacitor.isCapacitor
          ? styles.headerPlaceholderCapacitor
          : styles.headerPlaceholder
      }></div>
  );
}
