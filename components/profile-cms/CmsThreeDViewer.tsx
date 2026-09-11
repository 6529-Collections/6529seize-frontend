"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";

import type { CmsThreeDViewerConfig } from "@/components/profile-cms/CmsThreeDTypes";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  addMediaQueryChangeListener,
  getCmsThreeDConfigRuntimeKey,
  getSelectedCmsThreeDClickable,
} from "@/components/profile-cms/three-d/helpers";
import { createCmsThreeDRuntime } from "@/components/profile-cms/three-d/runtime";
import type {
  CmsThreeDRuntime,
  CmsThreeDStatus,
} from "@/components/profile-cms/three-d/types";
import {
  CmsThreeDFullscreenControl,
  CmsThreeDLinkTray,
  CmsThreeDOverlay,
} from "@/components/profile-cms/three-d/ui";

const MOBILE_FALLBACK_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export default function CmsThreeDViewer({
  config,
  locale = DEFAULT_LOCALE,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly locale?: SupportedLocale | undefined;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAutoStartedRef = useRef(false);
  const pointerGestureRef = useRef({ moved: false, x: 0, y: 0 });
  const runtimeRef = useRef<CmsThreeDRuntime | null>(null);
  const viewerFrameRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileFallback, setIsMobileFallback] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<CmsThreeDStatus>("idle");
  const configRuntimeKey = getCmsThreeDConfigRuntimeKey(config);
  const previousConfigRuntimeKeyRef = useRef(configRuntimeKey);

  const disposeRuntime = useCallback(() => {
    runtimeRef.current?.cleanup();
    runtimeRef.current = null;
  }, []);

  const startViewer = useCallback(async () => {
    if (status === "loading" || status === "ready") {
      return;
    }

    if (isMobileFallback) {
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    setStatus("loading");
    setProgress(0);
    disposeRuntime();

    try {
      const runtime = await createCmsThreeDRuntime({
        canvas,
        config,
        container,
        onProgress: setProgress,
        prefersReducedMotion,
      });
      runtimeRef.current = runtime;
      setProgress(100);
      setStatus("ready");
    } catch {
      disposeRuntime();
      setStatus("error");
    }
  }, [config, disposeRuntime, isMobileFallback, prefersReducedMotion, status]);

  const handleStartViewer = useCallback(() => {
    startViewer().catch(() => {
      setStatus("error");
    });
  }, [startViewer]);

  useEffect(() => {
    const mobileQuery = globalThis.matchMedia?.(MOBILE_FALLBACK_QUERY);
    const motionQuery = globalThis.matchMedia?.(REDUCED_MOTION_QUERY);

    const syncQueries = () => {
      setIsMobileFallback(!!mobileQuery?.matches);
      setPrefersReducedMotion(!!motionQuery?.matches);
    };

    syncQueries();
    const removeMobileListener = addMediaQueryChangeListener(
      mobileQuery,
      syncQueries
    );
    const removeMotionListener = addMediaQueryChangeListener(
      motionQuery,
      syncQueries
    );

    return () => {
      removeMobileListener();
      removeMotionListener();
    };
  }, []);

  useEffect(() => {
    if (previousConfigRuntimeKeyRef.current === configRuntimeKey) {
      return;
    }

    previousConfigRuntimeKeyRef.current = configRuntimeKey;
    hasAutoStartedRef.current = false;
    setProgress(0);
    setStatus("idle");
    disposeRuntime();
  }, [configRuntimeKey, disposeRuntime]);

  useEffect(() => {
    if (
      config.requiresActivation ||
      isMobileFallback ||
      hasAutoStartedRef.current
    ) {
      return;
    }

    hasAutoStartedRef.current = true;
    startViewer().catch(() => {
      setStatus("error");
    });
  }, [config.requiresActivation, isMobileFallback, startViewer]);

  useEffect(() => disposeRuntime, [disposeRuntime]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(
        !!viewerFrameRef.current &&
          globalThis.document.fullscreenElement === viewerFrameRef.current
      );
    };

    syncFullscreenState();
    globalThis.document.addEventListener(
      "fullscreenchange",
      syncFullscreenState
    );

    return () => {
      globalThis.document.removeEventListener(
        "fullscreenchange",
        syncFullscreenState
      );
    };
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const frame = viewerFrameRef.current;
    if (!frame) {
      return;
    }

    if (globalThis.document.fullscreenElement === frame) {
      globalThis.document.exitFullscreen?.().catch(() => undefined);
      return;
    }

    frame.requestFullscreen?.().catch(() => undefined);
  }, []);

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      event.currentTarget.focus({ preventScroll: true });
      pointerGestureRef.current = {
        moved: false,
        x: event.clientX,
        y: event.clientY,
      };
    },
    []
  );

  const onCanvasPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const gesture = pointerGestureRef.current;
      if (
        Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6
      ) {
        pointerGestureRef.current = { ...gesture, moved: true };
      }
    },
    []
  );

  const onCanvasPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const runtime = runtimeRef.current;
      const canvas = canvasRef.current;
      if (
        pointerGestureRef.current.moved ||
        !runtime ||
        !canvas ||
        !runtime.clickable.length
      ) {
        return;
      }

      const selected = getSelectedCmsThreeDClickable({
        canvas,
        event,
        runtime,
      });
      if (selected) {
        router.push(selected.href);
      }
    },
    [router]
  );

  const showOverlay = status !== "ready" || isMobileFallback;
  const frameClassName = isFullscreen
    ? "tw-fixed tw-inset-0 tw-z-[9999] tw-h-screen tw-min-h-screen tw-w-screen tw-border-0"
    : "tw-aspect-[16/9] tw-min-h-[22rem] tw-w-full tw-border tw-border-solid tw-border-iron-800 md:tw-min-h-[32rem]";

  return (
    <section
      aria-label={config.title}
      className={`tw-relative tw-isolate tw-overflow-hidden tw-bg-black ${frameClassName}`}
      data-cms-3d-kind={config.kind}
      data-cms-3d-fullscreen={isFullscreen}
      data-cms-3d-status={isMobileFallback ? "mobile-fallback" : status}
      ref={viewerFrameRef}
    >
      <div className="tw-absolute tw-inset-0" ref={containerRef}>
        <canvas
          aria-label={t(locale, "profileCms.interactive.canvasLabel")}
          className="tw-h-full tw-w-full"
          data-testid="cms-3d-canvas"
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          ref={canvasRef}
          tabIndex={0}
        />
      </div>
      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-shadow-[inset_0_0_180px_rgba(0,0,0,0.36)]"
      />

      {showOverlay ? (
        <CmsThreeDOverlay
          config={config}
          isMobileFallback={isMobileFallback}
          locale={locale}
          onStart={handleStartViewer}
          progress={progress}
          status={status}
        />
      ) : null}

      <CmsThreeDFullscreenControl
        isFullscreen={isFullscreen}
        locale={locale}
        onToggle={handleFullscreenToggle}
      />
      <CmsThreeDLinkTray config={config} locale={locale} />
    </section>
  );
}
