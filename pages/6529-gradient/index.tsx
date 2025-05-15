import styles from "../../styles/Home.module.scss";
import { useContext, useEffect } from "react";
import dynamic from "next/dynamic";
import { AuthContext, useAuth } from "../../components/auth/Auth";

const GradientsComponent = dynamic(
  () => import("../../components/6529Gradient/6529Gradient"),
  { ssr: false }
);

export default function GradientsPage() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "6529 Gradient | Collections",
    });
  }, []);

  const { connectedProfile } = useAuth();

  return (
    <main className={styles.main}>
      <GradientsComponent
        wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
      />
    </main>
  );
}

GradientsPage.metadata = {
  title: "6529 Gradient",
  description: "Collections",
  ogImage: `${process.env.BASE_ENDPOINT}/gradients-preview.png`,
  twitterCard: "summary_large_image",
};
