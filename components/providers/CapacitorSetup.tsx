"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import Head from "next/head";

export default function CapacitorBodyClass() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.body.classList.add("capacitor-native");
    }
  }, []);

  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <Head>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      />
    </Head>
  );
}
