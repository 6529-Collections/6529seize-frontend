"use client";

import { apiUrl } from "@/services/api/api-endpoints";
import { API_AUTH_COOKIE } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { t } from "@/i18n/messages";
import { resumeAfterApiAccess } from "@/services/auth/api-access-redirect";
import { getStagingAuth } from "@/services/auth/auth.utils";
import styles from "@/styles/Home.module.css";
import clsx from "clsx";
import Cookies from "js-cookie";
import Image from "next/image";
import { useEffect, useState } from "react";

function probeApiAccess(
  code: string | null,
  signal: AbortSignal | null = null
) {
  return fetch(apiUrl("/api/"), {
    headers: code === null ? {} : { "x-6529-auth": code },
    signal,
  });
}

export default function AccessPage() {
  useSetTitle("Access Page");
  useNativeKeyboard();
  const locale = useBrowserLocale();
  const [image, setImage] = useState<string>();
  const [errorKey, setErrorKey] = useState<
    "access.denied" | "access.verifyFailed" | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();
    void probeApiAccess(getStagingAuth(), controller.signal)
      .then(async (response) => {
        if (response.ok && !controller.signal.aborted) {
          resumeAfterApiAccess(window.location);
        } else if (response.status === 401) {
          const data: unknown = await response.json();
          if (
            !controller.signal.aborted &&
            typeof data === "object" &&
            data !== null &&
            "image" in data &&
            typeof data.image === "string" &&
            data.image.length > 0
          ) {
            setImage(data.image);
          }
        }
      })
      .catch(() => {
        // A failed initial probe leaves the code prompt available.
      });

    return () => controller.abort();
  }, []);

  async function doLogin(target: HTMLInputElement): Promise<void> {
    setErrorKey(null);
    target.select();
    const pass = target.value;
    try {
      const response = await probeApiAccess(pass);
      if (!response.ok) {
        setErrorKey(
          response.status === 401 ? "access.denied" : "access.verifyFailed"
        );
        return;
      }
      Cookies.set(API_AUTH_COOKIE, pass, {
        expires: 7,
        secure: window.location.protocol === "https:",
        sameSite: "strict",
      });
      // eslint-disable-next-line no-alert -- Keep the access confirmation before navigation.
      window.alert(t(locale, "access.granted"));
      resumeAfterApiAccess(window.location);
    } catch {
      setErrorKey("access.verifyFailed");
    }
  }

  return (
    <main className={styles["login"]}>
      {image ? (
        <LoginImage image={image} alt="" />
      ) : (
        <Image
          unoptimized
          src="/6529.svg"
          alt="6529"
          width={128}
          height={128}
          className="tw-h-auto tw-max-w-[40vw]"
        />
      )}
      <div
        className={clsx(
          styles["loginPrompt"],
          styles["loginPromptKeyboardAware"],
          "tw-flex-col tw-gap-2"
        )}
      >
        {/* Screenshots and browser extensions can set an inline caret style
            before this input hydrates. */}
        <input
          suppressHydrationWarning
          type="text"
          aria-label={t(locale, "access.codeInput.label")}
          aria-describedby={errorKey ? "api-access-error" : undefined}
          placeholder={t(locale, "access.codeInput.placeholder")}
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>): void => {
            if (event.key.toLowerCase() === "enter") {
              void doLogin(event.currentTarget);
            }
          }}
        />
        <div className="tw-h-10 tw-w-4/5 tw-max-w-[400px] tw-shrink-0">
          {errorKey && (
            <p
              id="api-access-error"
              role="alert"
              className="tw-m-0 tw-inline-block tw-bg-iron-950 tw-px-2 tw-text-sm tw-leading-5 tw-text-white"
            >
              {t(locale, errorKey)}
            </p>
          )}
        </div>
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
