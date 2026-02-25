import { Suspense } from "react";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";

type ErrorPageProps = {
  readonly searchParams?: Promise<{ readonly stack?: string | undefined }> | undefined;
};

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const stackTraceParam = (await searchParams)?.stack ?? null;

  return (
    <main className={styles["main"]}>
      <Suspense fallback={null}>
        <ErrorComponent stackTrace={stackTraceParam} />
      </Suspense>
    </main>
  );
}

ErrorPage.metadata = {
  title: "500 - ERROR",
};
