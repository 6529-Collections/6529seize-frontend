import styles from "../styles/Home.module.scss";
import Image from "next/image";
import { useSetTitle } from "../contexts/TitleContext";

export default function Seize404() {
  useSetTitle("404 - NOT FOUND");

  return (
    <main className={styles.main}>
      <div className={styles.pageNotFound}>
        <Image
          width="0"
          height="0"
          style={{ height: "auto", width: "100px" }}
          src="/SummerGlasses.svg"
          alt="SummerGlasses"
        />
        <h2>404 | PAGE NOT FOUND</h2>
        <a href="/" className="pt-3">
          TAKE ME HOME
        </a>
      </div>
    </main>
  );
}

Seize404.metadata = {
  title: "404 - NOT FOUND",
};
