import NotFound from "@/components/not-found/NotFound";
import styles from "@/styles/Home.module.scss";
import { Suspense } from "react";

export default function NotFoundPage() {
  return (
    <main className={styles["main"]}>
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    </main>
  );
}

NotFoundPage.metadata = {
  title: "404 - NOT FOUND",
};
