import { useEffect, useState } from "react";
import styles from "../styles/Home.module.scss";
import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "../constants";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Login() {
  const router = useRouter();
  const [image, setImage] = useState();
  const [inputDisabled, setInputDisabled] = useState(false);

  useEffect(() => {
    if (!image && router.isReady) {
      const apiAuth = Cookies.get(API_AUTH_COOKIE);
      fetch(`${process.env.API_ENDPOINT}/api/`, {
        headers: apiAuth ? { "x-6529-auth": apiAuth } : {},
      }).then((r: any) => {
        r.json().then((response: any) => {
          setImage(response.image);
        });
        if (r.status != 401) {
          setInputDisabled(true);
        }
      });
    }
  }, [router.isReady]);

  function doLogin(target: any) {
    target.select();
    const pass = target.value;
    fetch(`${process.env.API_ENDPOINT}/api/`, {
      headers: { "x-6529-auth": pass },
    }).then((r: any) => {
      if (r.status == 401) {
        alert("Access Denied!");
      } else {
        alert("gm!");
        Cookies.set(API_AUTH_COOKIE, pass);
        window.location.href = "/";
      }
    });
  }

  return (
    <>
      <Head>
        <title>Access Page | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Access Page | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${window.location.protocol}//${window.location.host}/access`}
        />
        <meta property="og:title" content={`Access Page`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${window.location.protocol}//${window.location.host}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <main className={styles.login}>
        {image && <img src={image} className={styles.loginImage} />}
        <div className={styles.loginPrompt}>
          <input
            disabled={inputDisabled}
            type="text"
            placeholder="Team Login"
            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>): void => {
              if (event.key.toLowerCase() == "enter") {
                doLogin(event.target);
              }
            }}
          />
        </div>
      </main>
    </>
  );
}
