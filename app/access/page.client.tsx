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
import Cookies from "js-cookie";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import accessStyles from "./AccessPage.module.css";

const FEEDBACK_MESSAGES = [
  "access.denied",
  "access.verifyFailed",
  "access.verifying",
] as const;

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
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationPending = useRef(false);
  const feedbackKey = isVerifying ? "access.verifying" : errorKey;

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
    if (verificationPending.current) return;

    verificationPending.current = true;
    setIsVerifying(true);
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
      resumeAfterApiAccess(window.location);
    } catch {
      setErrorKey("access.verifyFailed");
    } finally {
      verificationPending.current = false;
      setIsVerifying(false);
    }
  }

  return (
    <main className={accessStyles["page"]}>
      {image ? (
        <div className={accessStyles["artwork"]}>
          <LoginImage image={image} alt="" />
        </div>
      ) : (
        <Image
          unoptimized
          src="/gradient-100.svg"
          alt="6529"
          width={192}
          height={192}
          className={accessStyles["logo"]}
        />
      )}
      <div className={accessStyles["prompt"]}>
        <div className={accessStyles["fields"]}>
          <label htmlFor="api-access-code">
            {t(locale, "access.codeInput.label")}
          </label>
          {/* Screenshots and browser extensions can set an inline caret style
              before this input hydrates. */}
          <input
            id="api-access-code"
            suppressHydrationWarning
            type="text"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="go"
            readOnly={isVerifying}
            spellCheck={false}
            aria-invalid={errorKey === "access.denied" || undefined}
            aria-describedby={feedbackKey ? "api-access-feedback" : undefined}
            placeholder={t(locale, "access.codeInput.placeholder")}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>): void => {
              if (event.key.toLowerCase() === "enter") {
                void doLogin(event.currentTarget);
              }
            }}
          />
          <div className={accessStyles["feedback"]}>
            {/* Measure all messages so even wrapped copy cannot move the field. */}
            {FEEDBACK_MESSAGES.map((key) => {
              const visible = key === feedbackKey;
              const role = key === "access.verifying" ? "status" : "alert";
              return (
                <p
                  key={key}
                  id={visible ? "api-access-feedback" : undefined}
                  role={visible ? role : undefined}
                  aria-hidden={visible ? undefined : true}
                >
                  {t(locale, key)}
                </p>
              );
            })}
          </div>
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
