import { useEffect, useState, useContext } from "react";
import styles from "../styles/Home.module.scss";

import { useRouter } from "next/router";
import { LoginImage } from "./access";
import { AuthContext } from "../components/auth/Auth";
import { getStagingAuth } from "../services/auth/auth.utils";

export default function Access() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Restricted",
    });
  }, []);
  const router = useRouter();
  const [image, setImage] = useState();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!image && router.isReady) {
      const apiAuth = getStagingAuth();
      fetch(`${process.env.API_ENDPOINT}/api/`, {
        headers: apiAuth ? { "x-6529-auth": apiAuth } : {},
      }).then((r: any) => {
        r.json().then((response: any) => {
          setImage(response.image);
          if (r.status === 403) {
            const country = response.country;
            const msg = `Access from your country ${
              country ? `(${country}) ` : ""
            }is restricted`;
            setMessage(msg);
          } else {
            setMessage("Go to 6529.io");
          }
        });
      });
    }
  }, [router.isReady]);

  return (
    <main className={styles.login}>
      {image && <LoginImage image={image} alt="access" />}
      <div className={styles.loginPrompt}>
        <input
          disabled={true}
          type="text"
          className="text-center"
          value={message}
        />
      </div>
    </main>
  );
}

Access.metadata = {
  title: "Restricted",
};
