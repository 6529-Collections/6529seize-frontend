"use client";

import Cookies from "js-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { publicEnv } from "@/config/env";
import { API_AUTH_COOKIE } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import { getStagingAuth } from "@/services/auth/auth.utils";
import styles from "@/styles/Home.module.scss";

export default function AccessPage() {
  useSetTitle("Access Page");
  const router = useRouter();
  const [image, setImage] = useState<string>();
  const [inputDisabled, setInputDisabled] = useState(false);

  useEffect(() => {
    if (!image) {
      const apiAuth = getStagingAuth();
      fetch(`${publicEnv.API_ENDPOINT}/api/`, {
        headers: apiAuth ? { "x-6529-auth": apiAuth } : {},
      }).then((r: any) => {
        r.json().then((response: any) => {
          setImage(response.image);
        });
        if (r.status !== 401) {
          router.push("/");
          setInputDisabled(true);
        }
      });
    }
  }, [image, router]);

  function doLogin(target: HTMLInputElement) {
    target.select();
    const pass = target.value;
    fetch(`${publicEnv.API_ENDPOINT}/api/`, {
      headers: { "x-6529-auth": pass },
    }).then((r: any) => {
      if (r.status === 401) {
        alert("Access Denied!");
      } else {
        alert("gm!");
        const isSecure = globalThis.location?.protocol === "https:";
        Cookies.set(API_AUTH_COOKIE, pass, {
          expires: 7,
          secure: isSecure,
          sameSite: "strict",
        });
        window.location.href = "/";
      }
    });
  }

  return (
    <main className={styles["login"]}>
      {image && <LoginImage image={image} alt="access" />}
      <div className={styles["loginPrompt"]}>
        <input
          disabled={inputDisabled}
          type="text"
          className={inputDisabled ? "text-center" : ""}
          defaultValue={inputDisabled ? "Go to 6529.io" : ""}
          aria-label="Team access code"
          placeholder={inputDisabled ? "Go to 6529.io" : "Team Login"}
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>): void => {
            if (event.key.toLowerCase() === "enter") {
              doLogin(event.target as HTMLInputElement);
            }
          }}
        />
      </div>
    </main>
  );
}

export function LoginImage(props: Readonly<{ image: string; alt: string }>) {
  return (
    <Image
      unoptimized
      width="0"
      height="0"
      style={{
        height: "auto",
        width: "auto",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
      src={props.image}
      className={styles["loginImage"]}
      alt={props.alt}
    />
  );
}
