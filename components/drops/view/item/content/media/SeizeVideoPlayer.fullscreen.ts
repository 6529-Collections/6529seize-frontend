"use client";

import { fullScreenSupported } from "@/helpers/Helpers";

type FullscreenDocument = Document & {
  readonly webkitFullscreenElement?: Element | null;
  readonly mozFullScreenElement?: Element | null;
  readonly msFullscreenElement?: Element | null;
  readonly webkitFullscreenEnabled?: boolean | undefined;
  readonly mozFullScreenEnabled?: boolean | undefined;
  readonly msFullscreenEnabled?: boolean | undefined;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

export type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

export type NativeFullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitEnterFullScreen?: () => void;
  webkitExitFullscreen?: () => void;
};

export function getFullscreenElement() {
  const doc = document as FullscreenDocument;
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

export function isFullscreenEnabled() {
  const doc = document as FullscreenDocument;
  if (document.fullscreenEnabled) {
    return true;
  }
  if (doc.webkitFullscreenEnabled === true) {
    return true;
  }
  if (doc.mozFullScreenEnabled === true) {
    return true;
  }
  if (doc.msFullscreenEnabled === true) {
    return true;
  }
  return fullScreenSupported();
}

export async function enterFullscreen(element: FullscreenElement) {
  if (typeof element.requestFullscreen === "function") {
    await element.requestFullscreen();
    return true;
  }
  if (typeof element.webkitRequestFullscreen === "function") {
    await element.webkitRequestFullscreen();
    return true;
  }
  if (typeof element.mozRequestFullScreen === "function") {
    await element.mozRequestFullScreen();
    return true;
  }
  if (typeof element.msRequestFullscreen === "function") {
    await element.msRequestFullscreen();
    return true;
  }
  return false;
}

export async function exitFullscreen() {
  const doc = document as FullscreenDocument;
  if (typeof document.exitFullscreen === "function") {
    await document.exitFullscreen();
  } else if (typeof doc.webkitExitFullscreen === "function") {
    await doc.webkitExitFullscreen();
  } else if (typeof doc.mozCancelFullScreen === "function") {
    await doc.mozCancelFullScreen();
  } else if (typeof doc.msExitFullscreen === "function") {
    await doc.msExitFullscreen();
  }
}

export function enterNativeVideoFullscreen(video: HTMLVideoElement | null) {
  if (!video) {
    return false;
  }

  const nativeFullscreenVideo = video as NativeFullscreenVideo;
  if (typeof nativeFullscreenVideo.webkitEnterFullscreen === "function") {
    nativeFullscreenVideo.webkitEnterFullscreen();
    return true;
  }
  if (typeof nativeFullscreenVideo.webkitEnterFullScreen === "function") {
    nativeFullscreenVideo.webkitEnterFullScreen();
    return true;
  }
  return false;
}
