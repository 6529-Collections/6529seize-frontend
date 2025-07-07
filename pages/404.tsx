import styles from "@/styles/Home.module.scss";
import NotFound from "@/components/not-found/NotFound";

export default function NotFoundPage() {
  return (
    <main className={styles.main}>
      <NotFound />
    </main>
  );
}

NotFoundPage.metadata = {
  title: "404 - NOT FOUND",
};
