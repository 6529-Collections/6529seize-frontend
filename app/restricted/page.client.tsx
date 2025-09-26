"use client";

import { publicEnv } from "@/config/env";
import { useSetTitle } from "@/contexts/TitleContext";
import { getStagingAuth } from "@/services/auth/auth.utils";
import styles from "@/styles/Home.module.scss";
import { useEffect, useState } from "react";
import { LoginImage } from "../access/page.client";

export default function RestrictedPage() {
  useSetTitle("Restricted");
  const [image, setImage] = useState<string | undefined>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!image) {
      const apiAuth = getStagingAuth();
      fetch(`${publicEnv.API_ENDPOINT}/api/`, {
        headers: apiAuth ? { "x-6529-auth": apiAuth } : {},
      }).then((r: any) => {
        r.json().then((response: any) => {
          setImage(response.image);
          if (r.status === 403) {
            const country = response.country;
            const msg = `Access from your country ${
              country ? "(" + country + ") " : ""
            }is restricted`;
            setMessage(msg);
          } else {
            setMessage("Go to 6529.io");
          }
        });
      });
    }
  }, [image]);

  return (
    <main className={styles.login}>
      {image && <LoginImage image={image} alt="access" />}
      <div className={styles.loginPrompt}>
        <input disabled type="text" className="text-center" value={message} />
      </div>
    </main>
  );
}
