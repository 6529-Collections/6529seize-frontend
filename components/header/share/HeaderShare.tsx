"use client";

export { default } from "./header-share/HeaderShareTrigger";
// Fetches the modal on first render: mount it only once a user asks to connect.
export {
  LazyHeaderConnectModal as HeaderConnectModal,
  preloadHeaderQRModal,
} from "./header-share/lazyHeaderQRModal";
