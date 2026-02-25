import { Suspense } from "react";

import NotFound from "@/components/not-found/NotFound";
import styles from "@/styles/Home.module.scss";

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
