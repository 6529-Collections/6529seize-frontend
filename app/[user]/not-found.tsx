import NotFound from "@/components/not-found/NotFound";
import styles from "@/styles/Home.module.scss";
import { Suspense } from "react";

export default function UserNotFoundPage() {
  return (
    <main className={styles["main"]}>
      <Suspense fallback={null}>
        <NotFound label="USER OR PAGE" />
      </Suspense>
    </main>
  );
}

UserNotFoundPage.metadata = {
  title: "404 - NOT FOUND",
};
