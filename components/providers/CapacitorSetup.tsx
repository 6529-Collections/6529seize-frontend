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

    // Keep the layout viewport and artwork dimensions stable. Scroll the host
    // frame above the keyboard; its sandboxed controls remain artist-owned.
    let keyboardFrame: HTMLIFrameElement | null = null;
    let originalScrollMargin = "";
    let scrollContainer: HTMLElement | null = null;
    let originalPadding = "";
    const releaseFrame = () => {
      if (keyboardFrame) {
        keyboardFrame.style.scrollMarginBottom = originalScrollMargin;
        keyboardFrame = null;
      }
      if (scrollContainer) {
        scrollContainer.style.paddingBottom = originalPadding;
        scrollContainer = null;
      }
    };
    const showListener = Keyboard.addListener(
      "keyboardWillShow",
      ({ keyboardHeight }) => {
        releaseFrame();
        if (
          !(document.activeElement instanceof HTMLIFrameElement) ||
          keyboardHeight <= 0
        )
          return;
        keyboardFrame = document.activeElement;
        originalScrollMargin = keyboardFrame.style.scrollMarginBottom;
        keyboardFrame.style.scrollMarginBottom = `${keyboardHeight}px`;
        // Supply scroll space even when the frame is the last content item.
        // Padding the scroll host preserves the artwork's own size and aspect ratio.
        let parent = keyboardFrame.parentElement;
        while (parent && parent !== document.body) {
          const overflowY = getComputedStyle(parent).overflowY;
          if (overflowY === "auto" || overflowY === "scroll") break;
          parent = parent.parentElement;
        }
        scrollContainer = parent ?? document.body;
        originalPadding = scrollContainer.style.paddingBottom;
        const padding =
          Number.parseFloat(getComputedStyle(scrollContainer).paddingBottom) ||
          0;
        scrollContainer.style.paddingBottom = `${padding + keyboardHeight}px`;
      }
    );
    const visibleListener = Keyboard.addListener("keyboardDidShow", () => {
      if (
        keyboardFrame?.isConnected &&
        document.activeElement === keyboardFrame
      ) {
        keyboardFrame.scrollIntoView({ block: "end", behavior: "instant" });
      }
    });
    const hideListener = Keyboard.addListener("keyboardDidHide", releaseFrame);
    const releaseForHostFocus = () => {
      if (document.activeElement !== keyboardFrame) releaseFrame();
    };
    document.addEventListener("focusin", releaseForHostFocus);
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
      document.removeEventListener("focusin", releaseForHostFocus);
      releaseFrame();
      void (async () => {
        try {
          const listeners = await Promise.all([
            showListener,
            visibleListener,
            hideListener,
          ]);
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
