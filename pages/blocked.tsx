import { useEffect, useState } from "react";
import styles from "../styles/Home.module.scss";
import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "../constants";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";

export default function Access() {
  const router = useRouter();
  const [disabled, setDisabled] = useState(false);
  const [image, setImage] = useState();
  const [country, setCountry] = useState();

  useEffect(() => {
    if (!image && router.isReady) {
      const apiAuth = Cookies.get(API_AUTH_COOKIE);
      fetch(`${process.env.API_ENDPOINT}/api/`, {
        headers: apiAuth ? { "x-6529-auth": apiAuth } : {},
      }).then((r: any) => {
        r.json().then((response: any) => {
          setImage(response.image);
          setCountry(response.country);
        });
        if (r.status != 403) {
          setDisabled(true);
        }
      });
    }
  }, [router.isReady]);

  return (
    <>
      <Head>
        <title>Blocked Page | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Blocked Page | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/blocked`}
        />
        <meta property="og:title" content={`Blocked Page`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <main className={styles.login}>
        {image && (
          <Image
            width="0"
            height="0"
            style={{
              height: "auto",
              width: "auto",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            src={image}
            className={styles.loginImage}
            alt="access"
          />
        )}
        <div className={styles.loginPrompt}>
          <input
            disabled={true}
            type="text"
            className="text-center font-color"
            value={
              disabled
                ? "Go to seize.io"
                : `Your country (${country}) is blocked`
            }
          />
        </div>
      </main>
    </>
  );
}
