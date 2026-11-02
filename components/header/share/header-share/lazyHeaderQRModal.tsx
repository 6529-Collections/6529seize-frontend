"use client";

import dynamic from "next/dynamic";

// The QR share and device-connect modal (QR encoding, share targets and the
// connection-share flow) is only needed once someone opens it, so it stays
// out of the bundle every page downloads. Render these only after the first
// open request and call preloadHeaderQRModal on intent to hide the fetch.
const loadHeaderQRModal = () => import("./HeaderQRModal");

export const preloadHeaderQRModal = (): void => {
  loadHeaderQRModal().catch(() => undefined);
};

export const LazyHeaderPageShareModal = dynamic(
  () => loadHeaderQRModal().then((module) => module.HeaderPageShareModal),
  { ssr: false }
);

export const LazyHeaderConnectModal = dynamic(
  () => loadHeaderQRModal().then((module) => module.HeaderConnectModal),
  { ssr: false }
);
