"use client";

import { useEffect, useState } from "react";
import { normalizeLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

interface PrimaryRouteLoadingStatusProps {
  readonly messageKey: MessageKey;
}

function getBrowserLocale() {
  const languages = globalThis.navigator.languages;
  return normalizeLocale(languages[0] ?? globalThis.navigator.language);
}

export default function PrimaryRouteLoadingStatus({
  messageKey,
}: PrimaryRouteLoadingStatusProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateMessage = () => {
      setMessage(t(getBrowserLocale(), messageKey));
    };

    updateMessage();
    globalThis.addEventListener("languagechange", updateMessage);

    return () => {
      globalThis.removeEventListener("languagechange", updateMessage);
    };
  }, [messageKey]);

  return (
    <span aria-atomic="true" className="tw-sr-only" role="status">
      {message}
    </span>
  );
}
