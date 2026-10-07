"use client";

import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { useEffect } from "react";

export default function CapacitorSetup() {
  const { isCapacitor, isIos } = useCapacitor();
  const { isAppleMobile } = useDeviceInfo();

  useEffect(() => {
    if (isCapacitor) {
      document.body.classList.add("capacitor-native");
    } else {
      document.body.classList.remove("capacitor-native");
    }
  }, [isCapacitor]);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafari =
      isAppleMobile &&
      ((userAgent.includes("Version/") && userAgent.includes("Safari/")) ||
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);

    if (!isCapacitor && !isSafari) return;

    let currentMeta: HTMLMetaElement | null = null;
    let originalContent: string | null = null;
    let appliedContent: string | null = null;

    const updateViewport = () => {
      const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="viewport"]'
      );
      if (!meta) return;

      const content = meta.getAttribute("content");
      const webContent = content ?? "width=device-width,initial-scale=1";
      // iOS Safari ignores scale limits for pinch zoom, but respects them for
      // input focus zoom, including in cross-origin frames. Confirmed on iOS
      // 26.6.2: focus stays at 1x while a user pinch still reaches >2x.
      // Keep user-scalable enabled on the web. WKWebView retains the native lock.
      // https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/
      let nextContent =
        "width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,viewport-fit=cover";
      if (!isCapacitor) {
        nextContent = /maximum-scale\s*=/i.test(webContent)
          ? webContent.replace(
              /maximum-scale\s*=\s*[^,\s]+/i,
              "maximum-scale=1"
            )
          : `${webContent},maximum-scale=1`;
      }

      if (content === nextContent) return;
      currentMeta = meta;
      originalContent = content;
      appliedContent = nextContent;
      meta.setAttribute("content", nextContent);
    };

    // Next.js can replace viewport metadata during client-side navigation.
    // Observe the head so the policy also follows a replacement meta element.
    const observer = new MutationObserver(updateViewport);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content", "name"],
    });
    updateViewport();

    return () => {
      observer.disconnect();
      if (currentMeta === null) return;
      if (currentMeta.getAttribute("content") !== appliedContent) return;
      if (originalContent === null) {
        currentMeta.removeAttribute("content");
      } else {
        currentMeta.setAttribute("content", originalContent);
      }
    };
  }, [isCapacitor, isAppleMobile]);

  useEffect(() => {
    if (!isCapacitor || !isIos || !Capacitor.isPluginAvailable("Keyboard")) {
      return;
    }

    let keyboardFrame: HTMLIFrameElement | null = null;
    let originalScrollMargin = "";
    const releaseFrame = () => {
      if (!keyboardFrame) return;
      keyboardFrame.style.scrollMarginBottom = originalScrollMargin;
      keyboardFrame = null;
    };
    const showListener = Keyboard.addListener(
      "keyboardDidShow",
      ({ keyboardHeight }) => {
        releaseFrame();
        const frame = document.activeElement;
        if (
          !(frame instanceof HTMLIFrameElement) ||
          !frame.closest("[data-video-viewport]") ||
          keyboardHeight <= 0 ||
          frame.getBoundingClientRect().height <=
            window.innerHeight - keyboardHeight
        ) {
          return;
        }
        // Chat already follows the keyboard. Only a large single-view frame
        // needs scroll alignment; adding host padding creates blank space.
        keyboardFrame = frame;
        originalScrollMargin = frame.style.scrollMarginBottom;
        frame.style.scrollMarginBottom = keyboardHeight + "px";
        frame.scrollIntoView({ block: "end", behavior: "instant" });
      }
    );
    const hideListener = Keyboard.addListener("keyboardDidHide", releaseFrame);
    void (async () => {
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.None });
      } catch (error: unknown) {
        console.error(
          "[Capacitor Setup] Error setting keyboard resize mode:",
          error
        );
      }
    })();

    return () => {
      releaseFrame();
      void (async () => {
        try {
          const listeners = await Promise.all([showListener, hideListener]);
          await Promise.all(listeners.map((listener) => listener.remove()));
        } catch (error: unknown) {
          console.error(
            "[Capacitor Setup] Error removing keyboard listeners:",
            error
          );
        }
      })();
    };
  }, [isCapacitor, isIos]);

  return null;
}
