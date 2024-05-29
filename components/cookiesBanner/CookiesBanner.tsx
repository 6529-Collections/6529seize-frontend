import styles from "./CookiesBanner.module.scss";

export default function CookiesBanner() {
  return (
    <div className={styles.banner}>
      <span className="font-bolder">I am cookie consent</span>
      <button className={styles.accept}>accept</button>
      <span className="font-bolder">to make me go away</span>
    </div>
  );
}
