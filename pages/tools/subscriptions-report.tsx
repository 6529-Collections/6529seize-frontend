import styles from "../../styles/Home.module.scss";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";
import SubscriptionsReportComponent from "../../components/subscriptions-report/SubscriptionsReport";

export default function SubscriptionsReport() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Subscriptions Report | Tools",
    });
  }, []);

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
