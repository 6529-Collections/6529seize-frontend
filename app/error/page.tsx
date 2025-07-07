import { Suspense } from "react";
import styles from "@/styles/Home.module.scss";
import ErrorComponent from "@/components/error/Error";

export default function ErrorPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={null}>
        <ErrorComponent />
      </Suspense>
    </main>
  );
}

ErrorPage.metadata = {
  title: "500 - ERROR",
};
