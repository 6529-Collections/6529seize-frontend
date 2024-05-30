import { useEffect, useState } from "react";
import styles from "../styles/Home.module.scss";
import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "../constants";
import { useRouter } from "next/router";
import Head from "next/head";
import { LoginImage } from "./access";

export default function Access() {
  const router = useRouter();
  const [image, setImage] = useState();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!image && router.isReady) {
      const apiAuth = Cookies.get(API_AUTH_COOKIE);
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
            setMessage("Go to seize.io");
          }
        });
      });
    }
  }, [router.isReady]);

  return (
    <>
      <Head>
        <title>Restricted | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Restricted | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/restricted`}
        />
        <meta property="og:title" content={`Restricted`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
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
    </>
  );
}
