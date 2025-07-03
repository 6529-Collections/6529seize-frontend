import { Suspense } from "react";
import styles from "@/styles/Home.module.scss";
import Error from "@/components/error/Error";

export default function ErrorPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={null}>
        <Error />
      </Suspense>
    </main>
  );
}

ErrorPage.metadata = {
  title: "500 - ERROR",
};
