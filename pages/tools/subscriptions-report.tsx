import styles from "../../styles/Home.module.scss";
import { useSetTitle } from "../../contexts/TitleContext";
import SubscriptionsReportComponent from "../../components/subscriptions-report/SubscriptionsReport";

export default function SubscriptionsReport() {
  useSetTitle("Subscriptions Report | Tools");

  return (
    <main className={`${styles.main} tailwind-scope !tw-bg-iron-950`}>
      <SubscriptionsReportComponent />
    </main>
  );
}

SubscriptionsReport.metadata = {
  title: "Subscriptions Report",
  description: "Tools",
};
