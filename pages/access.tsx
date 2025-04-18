import { useContext, useEffect, useState } from "react";
import styles from "../styles/Home.module.scss";
import Cookies from "js-cookie";
import { API_AUTH_COOKIE } from "../constants";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { AuthContext } from "../components/auth/Auth";

export default function Access() {
  const { setTitle, title } = useContext(AuthContext);
  
  useEffect(() => {
    setTitle({
      title: "Access Page | 6529.io",
    });
  }, []);
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
          router.push("/");
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
      if (r.status === 401) {
        alert("Access Denied!");
      } else {
        alert("gm!");
        Cookies.set(API_AUTH_COOKIE, pass, {
          expires: 7,
          secure: true,
          sameSite: "strict",
        });
        window.location.href = "/";
      }
    });
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Access Page | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/access`}
        />
        <meta property="og:title" content={`Access Page`} />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>
      <main className={styles.login}>
        {image && <LoginImage image={image} alt="access" />}
        <div className={styles.loginPrompt}>
          <input
            disabled={inputDisabled}
            type="text"
            className={inputDisabled ? "text-center" : ""}
            defaultValue={inputDisabled ? "Go to 6529.io" : ""}
            placeholder={inputDisabled ? "Go to 6529.io" : "Team Login"}
            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>): void => {
              if (event.key.toLowerCase() === "enter") {
                doLogin(event.target);
              }
            }}
          />
        </div>
      </main>
    </>
  );
}

export function LoginImage(props: Readonly<{ image: string; alt: string }>) {
  return (
    <Image
      width="0"
      height="0"
      style={{
        height: "auto",
        width: "auto",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
      src={props.image}
      className={styles.loginImage}
      alt={props.alt}
    />
  );
}
