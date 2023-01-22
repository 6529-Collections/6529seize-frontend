import styles from "../styles/Home.module.scss";

export default function Login() {
  return (
    <>
      <main className={styles.main}>
        <div className={`${styles.mainContainer} ${styles.pageNotFound}`}>
          <img src="/SummerGlasses.svg" className={styles.summerGlasses404} />
          <h2>404 | PAGE NOT FOUND</h2>
          <a href="/" className="pt-3">
            TAKE ME HOME
          </a>
        </div>
      </main>
    </>
  );
}
