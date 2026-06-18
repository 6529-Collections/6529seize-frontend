"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type {
  Material,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Texture,
  Vector2,
  WebGLRenderer,
} from "three";

import type {
  CmsThreeDPlacement,
  CmsThreeDViewerConfig,
} from "@/components/profile-cms/CmsThreeDTypes";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  fitArtworkToFrame,
  getCmsRoomPreset,
} from "@/lib/profile-cms/runtime/threeD";

type ThreeModule = typeof import("three");

type CmsThreeDStatus = "idle" | "loading" | "ready" | "error";

type CmsThreeDClickable = {
  readonly href: string;
  readonly object: Object3D;
};

type CmsThreeDRuntime = {
  readonly THREE: ThreeModule;
  readonly camera: PerspectiveCamera;
  readonly cleanup: () => void;
  readonly clickable: readonly CmsThreeDClickable[];
  readonly pointer: Vector2;
  readonly raycaster: Raycaster;
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
};

type LegacyMediaQueryList = {
  readonly addListener?: ((listener: () => void) => void) | undefined;
  readonly removeListener?: ((listener: () => void) => void) | undefined;
};

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
  const router = useRouter();
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

  return (
    <section
      aria-label={config.title}
      className="tw-relative tw-left-1/2 tw-h-[calc(100vh-56px)] tw-min-h-[720px] tw-w-screen -tw-translate-x-1/2 tw-overflow-hidden tw-bg-black"
      data-cms-3d-kind={config.kind}
      data-cms-3d-status={isMobileFallback ? "mobile-fallback" : status}
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

      <CmsThreeDLinkTray config={config} locale={locale} />
    </section>
  );
}

function CmsThreeDOverlay({
  config,
  isMobileFallback,
  locale,
  onStart,
  progress,
  status,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly isMobileFallback: boolean;
  readonly locale: SupportedLocale;
  readonly onStart: () => void;
  readonly progress: number;
  readonly status: CmsThreeDStatus;
}) {
  return (
    <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black">
      <CmsThreeDPoster poster={config.poster} />
      <div className="tw-relative tw-z-10 tw-mx-4 tw-max-w-xl tw-bg-black/80 tw-p-5 tw-text-center">
        <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
          {getCmsThreeDEyebrow(config, locale)}
        </p>
        <h3 className="tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white">
          {config.title}
        </h3>
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {getCmsThreeDDescription({ config, isMobileFallback, locale })}
        </p>
        <CmsThreeDStatusMessages
          hasBudgetWarning={hasCmsThreeDBudgetWarning(config)}
          locale={locale}
          status={status}
        />
        <CmsThreeDStartControl
          config={config}
          isMobileFallback={isMobileFallback}
          locale={locale}
          onStart={onStart}
          progress={progress}
          status={status}
        />
      </div>
    </div>
  );
}

function CmsThreeDPoster({
  poster,
}: {
  readonly poster: CmsThreeDViewerConfig["poster"];
}) {
  return poster?.url ? (
    <Image
      alt={poster.alt}
      className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover tw-opacity-70"
      fill
      loading="lazy"
      sizes="100vw"
      src={poster.url}
      unoptimized
    />
  ) : null;
}

function CmsThreeDStatusMessages({
  hasBudgetWarning,
  locale,
  status,
}: {
  readonly hasBudgetWarning: boolean;
  readonly locale: SupportedLocale;
  readonly status: CmsThreeDStatus;
}) {
  return (
    <>
      {hasBudgetWarning ? (
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-amber-300">
          {t(locale, "profileCms.interactive.budgetWarning")}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-red">
          {t(locale, "profileCms.interactive.loadError")}
        </p>
      ) : null}
    </>
  );
}

function CmsThreeDStartControl({
  config,
  isMobileFallback,
  locale,
  onStart,
  progress,
  status,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly isMobileFallback: boolean;
  readonly locale: SupportedLocale;
  readonly onStart: () => void;
  readonly progress: number;
  readonly status: CmsThreeDStatus;
}) {
  if (isMobileFallback) {
    return null;
  }

  return (
    <button
      className="tw-mt-5 tw-min-h-11 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-70"
      disabled={status === "loading"}
      onClick={onStart}
      type="button"
    >
      {getCmsThreeDStartLabel({ config, locale, progress, status })}
    </button>
  );
}

function getCmsThreeDEyebrow(
  config: CmsThreeDViewerConfig,
  locale: SupportedLocale
): string {
  if (config.kind === "room") {
    return t(locale, "profileCms.interactive.room.title");
  }

  return t(locale, "profileCms.interactive.object.title");
}

function getCmsThreeDDescription({
  config,
  isMobileFallback,
  locale,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly isMobileFallback: boolean;
  readonly locale: SupportedLocale;
}): string {
  if (isMobileFallback) {
    return t(locale, "profileCms.interactive.mobileFallback");
  }

  return config.description;
}

function getCmsThreeDStartLabel({
  config,
  locale,
  progress,
  status,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly locale: SupportedLocale;
  readonly progress: number;
  readonly status: CmsThreeDStatus;
}): string {
  if (status === "loading") {
    return t(locale, "profileCms.interactive.loading", {
      progress: Math.round(progress),
    });
  }

  if (config.kind === "room") {
    return t(locale, "profileCms.interactive.enterRoom");
  }

  return t(locale, "profileCms.interactive.loadObject");
}

function hasCmsThreeDBudgetWarning(config: CmsThreeDViewerConfig): boolean {
  const budgetBytes = config.budgetBytes;
  if (budgetBytes === undefined) {
    return false;
  }

  if (config.kind === "room") {
    return config.placements.some(
      (placement) =>
        placement.asset.fileSizeBytes !== undefined &&
        placement.asset.fileSizeBytes > budgetBytes
    );
  }

  return (
    config.asset.fileSizeBytes !== undefined &&
    config.asset.fileSizeBytes > budgetBytes
  );
}

function getCmsThreeDConfigRuntimeKey(config: CmsThreeDViewerConfig): string {
  if (config.kind === "object") {
    return [
      config.kind,
      config.asset.id,
      config.asset.url,
      config.poster?.url ?? "",
      config.requiresActivation,
      config.sourceHref ?? "",
    ].join("|");
  }

  return [
    config.kind,
    config.preset,
    config.poster?.url ?? "",
    config.requiresActivation,
    ...config.placements.map((placement) =>
      [
        placement.id,
        placement.asset.id,
        placement.asset.url,
        placement.detailHref,
        placement.displayMode,
        placement.position?.join(",") ?? "",
        placement.rotation?.join(",") ?? "",
        placement.size?.join(",") ?? "",
      ].join(":")
    ),
  ].join("|");
}

function addMediaQueryChangeListener(
  query: MediaQueryList | undefined,
  listener: () => void
): () => void {
  if (!query) {
    return () => {};
  }

  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }

  const legacyQuery = query as LegacyMediaQueryList;
  legacyQuery.addListener?.(listener);
  return () => legacyQuery.removeListener?.(listener);
}

function getSelectedCmsThreeDClickable({
  canvas,
  event,
  runtime,
}: {
  readonly canvas: HTMLCanvasElement;
  readonly event: ReactPointerEvent<HTMLCanvasElement>;
  readonly runtime: CmsThreeDRuntime;
}): CmsThreeDClickable | undefined {
  const rect = canvas.getBoundingClientRect();
  runtime.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  runtime.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  runtime.raycaster.setFromCamera(runtime.pointer, runtime.camera);

  const intersections = runtime.raycaster.intersectObjects(
    runtime.clickable.map((item) => item.object),
    true
  );

  return intersections
    .map((intersection) =>
      runtime.clickable.find(
        (item) =>
          item.object === intersection.object ||
          item.object === intersection.object.parent
      )
    )
    .find((item): item is CmsThreeDClickable => !!item);
}

function CmsThreeDLinkTray({
  config,
  locale,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly locale: SupportedLocale;
}) {
  if (config.kind === "object") {
    return config.sourceHref ? (
      <div className="tw-absolute tw-bottom-4 tw-left-4 tw-z-20">
        <a
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-bg-black/80 tw-px-3 tw-text-sm tw-font-semibold tw-text-white hover:tw-text-primary-300"
          href={config.sourceHref}
        >
          {t(locale, "profileCms.interactive.openSourceMedia")}
        </a>
      </div>
    ) : null;
  }

  return (
    <nav
      aria-label={t(locale, "profileCms.interactive.roomWorksLabel")}
      className="tw-absolute tw-bottom-5 tw-left-24 tw-right-5 tw-z-20 tw-flex tw-flex-wrap tw-gap-2"
    >
      {config.placements.map((placement) => (
        <a
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-border tw-border-white/15 tw-bg-black/45 tw-px-3 tw-text-sm tw-font-semibold tw-text-white tw-backdrop-blur-md hover:tw-border-white/35 hover:tw-text-primary-300"
          href={placement.detailHref}
          key={placement.id}
        >
          {placement.label}
        </a>
      ))}
      {config.fallbackHref ? (
        <a
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-border tw-border-white/15 tw-bg-black/35 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-200 tw-backdrop-blur-md hover:tw-border-white/35 hover:tw-text-white"
          href={config.fallbackHref}
        >
          {t(locale, "profileCms.interactive.openFallback")}
        </a>
      ) : null}
    </nav>
  );
}

async function createCmsThreeDRuntime({
  canvas,
  config,
  container,
  onProgress,
  prefersReducedMotion,
}: {
  readonly canvas: HTMLCanvasElement;
  readonly config: CmsThreeDViewerConfig;
  readonly container: HTMLElement;
  readonly onProgress: (progress: number) => void;
  readonly prefersReducedMotion: boolean;
}): Promise<CmsThreeDRuntime> {
  const THREE = await import("three");
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = config.kind === "room" ? 1.08 : 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(
    Math.min(globalThis.devicePixelRatio || 1, config.kind === "room" ? 1.5 : 2)
  );

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const clickable: CmsThreeDClickable[] = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  if (config.kind === "room") {
    await buildRoomScene({ THREE, clickable, config, scene });
  } else {
    await buildObjectScene({ THREE, camera, config, onProgress, scene });
  }

  let updateControls = (_delta: number) => {};
  let disposeControls = () => {};
  if (config.kind === "room") {
    const navigation = createRoomNavigation({
      THREE,
      camera,
      canvas,
      preset: getCmsRoomPreset(config.preset),
      prefersReducedMotion,
    });
    updateControls = navigation.update;
    disposeControls = navigation.dispose;
  } else {
    const { OrbitControls } =
      await import("three/examples/jsm/controls/OrbitControls.js");
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = !prefersReducedMotion;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.maxDistance = 10;
    controls.minDistance = 1.2;
    camera.position.set(0, 1.2, 4);
    controls.target.set(0, 0.8, 0);
    updateControls = () => controls.update();
    disposeControls = () => controls.dispose();
  }

  const resize = () => {
    resizeRenderer({ camera, container, renderer });
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  let frameId = 0;
  const clock = new THREE.Clock();
  const renderFrame = () => {
    updateControls(clock.getDelta());
    renderer.render(scene, camera);
    frameId = globalThis.requestAnimationFrame(renderFrame);
  };
  renderFrame();

  return {
    THREE,
    camera,
    cleanup: () => {
      globalThis.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      disposeControls();
      disposeScene(scene);
      renderer.dispose();
    },
    clickable,
    pointer,
    raycaster,
    renderer,
    scene,
  };
}

type CmsRoomNavigation = {
  readonly dispose: () => void;
  readonly update: (delta: number) => void;
};

const ROOM_EYE_HEIGHT = 1.78;
const ROOM_GRAVITY = 10.5;
const ROOM_JUMP_VELOCITY = 3.8;
const ROOM_LOOK_SENSITIVITY = 0.0022;

function createRoomNavigation({
  THREE,
  camera,
  canvas,
  preset,
  prefersReducedMotion,
}: {
  readonly THREE: ThreeModule;
  readonly camera: PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly prefersReducedMotion: boolean;
}): CmsRoomNavigation {
  const pressedKeys = new Set<string>();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();
  let isDragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let yaw = 0;
  let pitch = 0;
  let jumpOffset = 0;
  let verticalVelocity = 0;

  camera.position.set(...preset.camera);
  camera.position.y = ROOM_EYE_HEIGHT;
  camera.rotation.order = "YXZ";
  const initialTarget = new THREE.Vector3(
    0,
    preset.wallHeight * 0.48,
    -preset.roomDepth / 2
  );
  yaw = -Math.atan2(
    initialTarget.x - camera.position.x,
    camera.position.z - initialTarget.z
  );
  pitch = clampNumber(
    Math.atan2(
      initialTarget.y - ROOM_EYE_HEIGHT,
      Math.hypot(
        initialTarget.x - camera.position.x,
        initialTarget.z - camera.position.z
      )
    ),
    -Math.PI / 2.8,
    Math.PI / 2.8
  );
  camera.rotation.set(pitch, yaw, 0);
  canvas.focus({ preventScroll: true });
  canvas.style.cursor = "grab";

  const roomHalfWidth = Math.max(0.8, preset.roomWidth / 2 - 0.85);
  const roomHalfDepth = Math.max(0.8, preset.roomDepth / 2 - 0.85);
  const walkSpeed = prefersReducedMotion ? 2.2 : 3.6;
  const turnSpeed = prefersReducedMotion ? 0.9 : 1.35;

  const isActive = () => globalThis.document?.activeElement === canvas;

  const onKeyDown = (event: KeyboardEvent) => {
    const key = normalizeRoomNavigationKey(event.key);
    if (!key || !isActive()) {
      return;
    }

    event.preventDefault();
    pressedKeys.add(key);
    if (key === "space" && !event.repeat && jumpOffset === 0) {
      verticalVelocity = ROOM_JUMP_VELOCITY;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    const key = normalizeRoomNavigationKey(event.key);
    if (!key) {
      return;
    }

    pressedKeys.delete(key);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    canvas.focus({ preventScroll: true });
    isDragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!isDragging) {
      return;
    }

    const deltaX = event.clientX - lastPointerX;
    const deltaY = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    yaw -= deltaX * ROOM_LOOK_SENSITIVITY;
    pitch = clampNumber(
      pitch - deltaY * ROOM_LOOK_SENSITIVITY,
      -Math.PI / 2.8,
      Math.PI / 2.8
    );
  };

  const finishPointer = (event: PointerEvent) => {
    isDragging = false;
    canvas.style.cursor = "grab";
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  globalThis.addEventListener("keydown", onKeyDown);
  globalThis.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);

  return {
    dispose: () => {
      globalThis.removeEventListener("keydown", onKeyDown);
      globalThis.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", finishPointer);
      canvas.removeEventListener("pointercancel", finishPointer);
      canvas.style.cursor = "";
    },
    update: (delta: number) => {
      const safeDelta = Math.min(delta, 0.05);
      const forwardIntent =
        (pressedKeys.has("w") || pressedKeys.has("arrowup") ? 1 : 0) -
        (pressedKeys.has("s") || pressedKeys.has("arrowdown") ? 1 : 0);
      const strafeIntent =
        (pressedKeys.has("d") ? 1 : 0) - (pressedKeys.has("a") ? 1 : 0);
      const turnIntent =
        (pressedKeys.has("arrowright") ? 1 : 0) -
        (pressedKeys.has("arrowleft") ? 1 : 0);

      yaw -= turnIntent * turnSpeed * safeDelta;
      forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      right.set(Math.cos(yaw), 0, -Math.sin(yaw));
      move.set(0, 0, 0);
      move.addScaledVector(forward, forwardIntent);
      move.addScaledVector(right, strafeIntent);
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(walkSpeed * safeDelta);
        camera.position.x = clampNumber(
          camera.position.x + move.x,
          -roomHalfWidth,
          roomHalfWidth
        );
        camera.position.z = clampNumber(
          camera.position.z + move.z,
          -roomHalfDepth,
          roomHalfDepth
        );
      }

      if (jumpOffset > 0 || verticalVelocity > 0) {
        verticalVelocity -= ROOM_GRAVITY * safeDelta;
        jumpOffset = Math.max(0, jumpOffset + verticalVelocity * safeDelta);
        if (jumpOffset === 0) {
          verticalVelocity = 0;
        }
      }

      camera.position.y = ROOM_EYE_HEIGHT + jumpOffset;
      camera.rotation.set(pitch, yaw, 0);
    },
  };
}

function normalizeRoomNavigationKey(key: string): string | null {
  const normalized = key.toLowerCase();
  if (
    normalized === "w" ||
    normalized === "a" ||
    normalized === "s" ||
    normalized === "d" ||
    normalized === "arrowup" ||
    normalized === "arrowdown" ||
    normalized === "arrowleft" ||
    normalized === "arrowright"
  ) {
    return normalized;
  }

  return normalized === " " || normalized === "spacebar" ? "space" : null;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

async function buildRoomScene({
  THREE,
  clickable,
  config,
  scene,
}: {
  readonly THREE: ThreeModule;
  readonly clickable: CmsThreeDClickable[];
  readonly config: Extract<CmsThreeDViewerConfig, { readonly kind: "room" }>;
  readonly scene: Scene;
}): Promise<void> {
  const preset = getCmsRoomPreset(config.preset);
  const materials = createMuseumRoomMaterials({ THREE, preset });
  scene.background = new THREE.Color(
    config.preset === "dark_room" ? "#060606" : "#0b0a08"
  );
  scene.fog = new THREE.Fog(
    config.preset === "dark_room" ? "#050505" : "#17130e",
    preset.roomDepth * 0.72,
    preset.roomDepth * 1.35
  );

  addMuseumLighting({ THREE, config, preset, scene });
  addMuseumRoomShell({ THREE, materials, preset, scene });
  addMuseumArchitecturalDetails({ THREE, materials, preset, scene });

  await Promise.all(
    config.placements.map((placement, index) =>
      addArtworkPlacement({
        THREE,
        clickable,
        index,
        placementCount: config.placements.length,
        placement,
        preset,
        scene,
      })
    )
  );
}

function createMuseumRoomMaterials({
  THREE,
  preset,
}: {
  readonly THREE: ThreeModule;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
}) {
  const wallTexture = createWallTexture({ THREE, baseColor: preset.wallColor });
  wallTexture.repeat.set(2.4, 1.35);
  const floorTexture = createStoneFloorTexture({
    THREE,
    baseColor: preset.floorColor,
  });
  floorTexture.repeat.set(2.8, 4.2);

  return {
    bronze: new THREE.MeshStandardMaterial({
      color: "#9d7f4f",
      metalness: 0.58,
      roughness: 0.26,
    }),
    ceiling: new THREE.MeshStandardMaterial({
      color: "#e8dfcf",
      roughness: 0.82,
    }),
    darkTrim: new THREE.MeshStandardMaterial({
      color: "#1d1a16",
      metalness: 0.16,
      roughness: 0.38,
    }),
    displayPanel: new THREE.MeshStandardMaterial({
      color: "#fbf6ec",
      map: wallTexture.clone(),
      roughness: 0.84,
    }),
    floor: new THREE.MeshStandardMaterial({
      color: preset.floorColor,
      map: floorTexture,
      metalness: 0.04,
      roughness: 0.34,
    }),
    lightPanel: new THREE.MeshBasicMaterial({
      color: "#fff0d2",
    }),
    shadow: new THREE.MeshStandardMaterial({
      color: "#bfb5a4",
      metalness: 0.08,
      roughness: 0.5,
    }),
    trim: new THREE.MeshStandardMaterial({
      color: "#d2c3a7",
      metalness: 0.08,
      roughness: 0.36,
    }),
    wall: new THREE.MeshStandardMaterial({
      color: preset.wallColor,
      map: wallTexture,
      roughness: 0.88,
    }),
  };
}

function addMuseumLighting({
  THREE,
  config,
  preset,
  scene,
}: {
  readonly THREE: ThreeModule;
  readonly config: Extract<CmsThreeDViewerConfig, { readonly kind: "room" }>;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly scene: Scene;
}): void {
  const ambientIntensity = config.preset === "dark_room" ? 0.26 : 0.34;
  scene.add(new THREE.AmbientLight("#fff7eb", ambientIntensity));
  scene.add(new THREE.HemisphereLight("#fff8ed", "#62584c", 0.62));

  const roomFill = new THREE.DirectionalLight("#fff1d7", 1.85);
  roomFill.position.set(-preset.roomWidth * 0.32, preset.wallHeight + 2.4, 7.8);
  roomFill.castShadow = true;
  roomFill.shadow.mapSize.width = 2048;
  roomFill.shadow.mapSize.height = 2048;
  scene.add(roomFill);

  const artTarget = new THREE.Object3D();
  artTarget.position.set(0, preset.wallHeight * 0.5, -preset.roomDepth / 2);
  scene.add(artTarget);
  const artSpot = new THREE.SpotLight(
    "#fff4df",
    10.5,
    preset.roomDepth,
    0.32,
    0.7,
    1.4
  );
  artSpot.position.set(0, preset.wallHeight - 0.62, -preset.roomDepth / 2 + 6.4);
  artSpot.target = artTarget;
  artSpot.castShadow = true;
  artSpot.shadow.mapSize.width = 2048;
  artSpot.shadow.mapSize.height = 2048;
  scene.add(artSpot);

  const leftCove = new THREE.RectAreaLight(
    "#ffe8bd",
    5.2,
    preset.roomDepth * 0.74,
    0.48
  );
  leftCove.position.set(-preset.roomWidth / 2 + 0.24, preset.wallHeight - 0.45, 0);
  leftCove.rotation.set(0, Math.PI / 2, 0);
  scene.add(leftCove);

  const rightCove = new THREE.RectAreaLight(
    "#ffe8bd",
    5.2,
    preset.roomDepth * 0.74,
    0.48
  );
  rightCove.position.set(preset.roomWidth / 2 - 0.24, preset.wallHeight - 0.45, 0);
  rightCove.rotation.set(0, -Math.PI / 2, 0);
  scene.add(rightCove);

  [-0.32, 0.32].forEach((xOffset) => {
    const accentSpot = new THREE.SpotLight(
      "#f9dca6",
      4.2,
      preset.roomDepth * 0.68,
      0.28,
      0.62,
      1.6
    );
    accentSpot.position.set(
      xOffset * preset.roomWidth,
      preset.wallHeight - 0.75,
      -preset.roomDepth / 2 + 5.2
    );
    accentSpot.target = artTarget;
    accentSpot.castShadow = true;
    accentSpot.shadow.mapSize.width = 1024;
    accentSpot.shadow.mapSize.height = 1024;
    scene.add(accentSpot);
  });
}

function addMuseumRoomShell({
  THREE,
  materials,
  preset,
  scene,
}: {
  readonly THREE: ThreeModule;
  readonly materials: ReturnType<typeof createMuseumRoomMaterials>;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly scene: Scene;
}): void {
  addRoomPlane({
    THREE,
    material: materials.floor,
    position: [0, 0, 0],
    receiveShadow: true,
    rotation: [-Math.PI / 2, 0, 0],
    scene,
    size: [preset.roomWidth, preset.roomDepth],
  });
  addRoomPlane({
    THREE,
    material: materials.ceiling,
    position: [0, preset.wallHeight, 0],
    receiveShadow: true,
    rotation: [Math.PI / 2, 0, 0],
    scene,
    size: [preset.roomWidth, preset.roomDepth],
  });
  addRoomPlane({
    THREE,
    material: materials.wall,
    position: [0, preset.wallHeight / 2, -preset.roomDepth / 2],
    receiveShadow: true,
    scene,
    size: [preset.roomWidth, preset.wallHeight],
  });
  addRoomPlane({
    THREE,
    material: materials.wall,
    position: [0, preset.wallHeight / 2, preset.roomDepth / 2],
    receiveShadow: true,
    rotation: [0, Math.PI, 0],
    scene,
    size: [preset.roomWidth, preset.wallHeight],
  });
  addRoomPlane({
    THREE,
    material: materials.wall,
    position: [-preset.roomWidth / 2, preset.wallHeight / 2, 0],
    receiveShadow: true,
    rotation: [0, Math.PI / 2, 0],
    scene,
    size: [preset.roomDepth, preset.wallHeight],
  });
  addRoomPlane({
    THREE,
    material: materials.wall,
    position: [preset.roomWidth / 2, preset.wallHeight / 2, 0],
    receiveShadow: true,
    rotation: [0, -Math.PI / 2, 0],
    scene,
    size: [preset.roomDepth, preset.wallHeight],
  });
}

function addMuseumArchitecturalDetails({
  THREE,
  materials,
  preset,
  scene,
}: {
  readonly THREE: ThreeModule;
  readonly materials: ReturnType<typeof createMuseumRoomMaterials>;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly scene: Scene;
}): void {
  const halfWidth = preset.roomWidth / 2;
  const halfDepth = preset.roomDepth / 2;
  const trimY = 0.2;
  const crownY = preset.wallHeight - 0.18;
  const backWallZ = -halfDepth;

  addMuseumWallGlow({ THREE, preset, scene });

  addRoomBox({
    THREE,
    material: materials.trim,
    position: [0, trimY, backWallZ + 0.08],
    receiveShadow: true,
    scene,
    size: [preset.roomWidth, 0.28, 0.16],
  });
  addRoomBox({
    THREE,
    material: materials.trim,
    position: [0, trimY, halfDepth - 0.08],
    receiveShadow: true,
    scene,
    size: [preset.roomWidth, 0.28, 0.16],
  });
  addRoomBox({
    THREE,
    material: materials.trim,
    position: [-halfWidth + 0.08, trimY, 0],
    receiveShadow: true,
    scene,
    size: [0.16, 0.28, preset.roomDepth],
  });
  addRoomBox({
    THREE,
    material: materials.trim,
    position: [halfWidth - 0.08, trimY, 0],
    receiveShadow: true,
    scene,
    size: [0.16, 0.28, preset.roomDepth],
  });
  addRoomBox({
    THREE,
    material: materials.trim,
    position: [0, crownY, backWallZ + 0.1],
    receiveShadow: true,
    scene,
    size: [preset.roomWidth, 0.24, 0.2],
  });
  addRoomBox({
    THREE,
    material: materials.trim,
    position: [0, crownY, halfDepth - 0.1],
    receiveShadow: true,
    scene,
    size: [preset.roomWidth, 0.24, 0.2],
  });
  addRoomBox({
    THREE,
    material: materials.trim,
    position: [-halfWidth + 0.1, crownY, 0],
    receiveShadow: true,
    scene,
    size: [0.2, 0.24, preset.roomDepth],
  });
  addRoomBox({
    THREE,
    material: materials.trim,
    position: [halfWidth - 0.1, crownY, 0],
    receiveShadow: true,
    scene,
    size: [0.2, 0.24, preset.roomDepth],
  });

  [-halfWidth + 1.18, halfWidth - 1.18].forEach((x) => {
    addRoomBox({
      THREE,
      castShadow: true,
      material: materials.trim,
      position: [x, preset.wallHeight / 2, backWallZ + 0.16],
      receiveShadow: true,
      scene,
      size: [0.34, preset.wallHeight - 0.9, 0.34],
    });
  });

  [-halfWidth + 0.38, halfWidth - 0.38].forEach((x) => {
    addRoomBox({
      THREE,
      material: materials.lightPanel,
      position: [x, preset.wallHeight - 0.54, 0],
      scene,
      size: [0.08, 0.08, preset.roomDepth - 3.2],
    });
  });

  [-8.2, 0, 8.2].forEach((z) => {
    [-halfWidth + 0.16, halfWidth - 0.16].forEach((x) => {
      addRoomBox({
        THREE,
        castShadow: true,
        material: materials.trim,
        position: [x, preset.wallHeight / 2, z],
        receiveShadow: true,
        scene,
        size: [0.32, preset.wallHeight - 1.25, 0.52],
      });
    });
  });

  [-halfWidth + 1.55, halfWidth - 1.55].forEach((x) => {
    [-10.2, 4.8].forEach((z) => {
      addMuseumColumn({
        THREE,
        materials,
        position: [x, preset.wallHeight / 2 - 0.18, z],
        scene,
        shaftHeight: preset.wallHeight - 2.1,
      });
    });
  });

  addRoomBox({
    THREE,
    castShadow: true,
    material: materials.darkTrim,
    position: [0, 0.32, 5.8],
    receiveShadow: true,
    scene,
    size: [5.6, 0.64, 1.25],
  });
  addRoomBox({
    THREE,
    castShadow: true,
    material: materials.trim,
    position: [0, 0.68, 5.8],
    receiveShadow: true,
    scene,
    size: [5.8, 0.16, 1.38],
  });
}

function addMuseumWallGlow({
  THREE,
  preset,
  scene,
}: {
  readonly THREE: ThreeModule;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly scene: Scene;
}): void {
  const texture = createWallGlowTexture({ THREE });
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(
      Math.min(13, preset.roomWidth - 4),
      Math.min(9.4, preset.wallHeight - 0.7)
    ),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    })
  );
  glow.position.set(0, preset.wallHeight * 0.51, -preset.roomDepth / 2 + 0.035);
  scene.add(glow);
}

function addMuseumColumn({
  THREE,
  materials,
  position,
  scene,
  shaftHeight,
}: {
  readonly THREE: ThreeModule;
  readonly materials: ReturnType<typeof createMuseumRoomMaterials>;
  readonly position: readonly [number, number, number];
  readonly scene: Scene;
  readonly shaftHeight: number;
}): void {
  const [x, y, z] = position;
  addRoomCylinder({
    THREE,
    castShadow: true,
    material: materials.trim,
    position: [x, y, z],
    receiveShadow: true,
    radius: 0.28,
    scene,
    segments: 56,
    size: shaftHeight,
  });
  addRoomCylinder({
    THREE,
    castShadow: true,
    material: materials.bronze,
    position: [x, y - shaftHeight / 2 - 0.08, z],
    receiveShadow: true,
    radius: 0.43,
    scene,
    segments: 56,
    size: 0.16,
  });
  addRoomCylinder({
    THREE,
    castShadow: true,
    material: materials.bronze,
    position: [x, y + shaftHeight / 2 + 0.08, z],
    receiveShadow: true,
    radius: 0.43,
    scene,
    segments: 56,
    size: 0.16,
  });
}

function addRoomPlane({
  THREE,
  material,
  position,
  receiveShadow = false,
  rotation = [0, 0, 0],
  scene,
  size,
}: {
  readonly THREE: ThreeModule;
  readonly material: Material;
  readonly position: readonly [number, number, number];
  readonly receiveShadow?: boolean;
  readonly rotation?: readonly [number, number, number];
  readonly scene: Scene;
  readonly size: readonly [number, number];
}): void {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
  plane.receiveShadow = receiveShadow;
  plane.position.set(...position);
  plane.rotation.set(...rotation);
  scene.add(plane);
}

function addRoomBox({
  THREE,
  castShadow = false,
  material,
  position,
  receiveShadow = false,
  scene,
  size,
}: {
  readonly THREE: ThreeModule;
  readonly castShadow?: boolean;
  readonly material: Material;
  readonly position: readonly [number, number, number];
  readonly receiveShadow?: boolean;
  readonly scene: Scene;
  readonly size: readonly [number, number, number];
}): void {
  const box = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  box.castShadow = castShadow;
  box.receiveShadow = receiveShadow;
  box.position.set(...position);
  scene.add(box);
}

function addRoomCylinder({
  THREE,
  castShadow = false,
  material,
  position,
  radius,
  receiveShadow = false,
  scene,
  segments = 48,
  size,
}: {
  readonly THREE: ThreeModule;
  readonly castShadow?: boolean;
  readonly material: Material;
  readonly position: readonly [number, number, number];
  readonly radius: number;
  readonly receiveShadow?: boolean;
  readonly scene: Scene;
  readonly segments?: number;
  readonly size: number;
}): void {
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, size, segments),
    material
  );
  cylinder.castShadow = castShadow;
  cylinder.receiveShadow = receiveShadow;
  cylinder.position.set(...position);
  scene.add(cylinder);
}

function createWallTexture({
  THREE,
  baseColor,
}: {
  readonly THREE: ThreeModule;
  readonly baseColor: string;
}): Texture {
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#fbf6ec");
  gradient.addColorStop(0.45, baseColor);
  gradient.addColorStop(1, "#e1d6c6");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 180; index += 1) {
    const x = (index * 41) % canvas.width;
    const y = (index * 67) % canvas.height;
    const radius = 18 + (index % 17);
    const plaster = context.createRadialGradient(x, y, 0, x, y, radius);
    plaster.addColorStop(0, "rgba(255,255,255,0.035)");
    plaster.addColorStop(1, "rgba(120,105,84,0)");
    context.fillStyle = plaster;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function createWallGlowTexture({ THREE }: { readonly THREE: ThreeModule }): Texture {
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const glow = context.createRadialGradient(512, 520, 80, 512, 520, 520);
    glow.addColorStop(0, "rgba(255,244,221,0.58)");
    glow.addColorStop(0.38, "rgba(255,236,198,0.2)");
    glow.addColorStop(0.72, "rgba(255,225,178,0.06)");
    glow.addColorStop(1, "rgba(255,225,178,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createStoneFloorTexture({
  THREE,
  baseColor,
}: {
  readonly THREE: ThreeModule;
  readonly baseColor: string;
}): Texture {
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#eee7d7");
  gradient.addColorStop(0.5, baseColor);
  gradient.addColorStop(1, "#beb49f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 30; index += 1) {
    const startX = (index * 93) % canvas.width;
    const startY = (index * 47) % canvas.height;
    context.beginPath();
    context.moveTo(startX, startY);
    context.bezierCurveTo(
      startX + 90,
      startY - 70,
      startX + 160,
      startY + 85,
      startX + 260,
      startY + 16
    );
    context.strokeStyle =
      index % 3 === 0 ? "rgba(96,84,66,0.16)" : "rgba(255,255,255,0.19)";
    context.lineWidth = index % 3 === 0 ? 1.6 : 0.9;
    context.stroke();
  }

  for (let index = 0; index < 240; index += 1) {
    const x = (index * 53) % canvas.width;
    const y = (index * 97) % canvas.height;
    context.fillStyle =
      index % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(82,72,58,0.028)";
    context.fillRect(x, y, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function getRoomArtworkTransform({
  index,
  placement,
  placementCount,
  preset,
}: {
  readonly index: number;
  readonly placement: CmsThreeDPlacement;
  readonly placementCount: number;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
}): {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly size: readonly [number, number];
} {
  const existingSize = placement.size;
  const isLegacySmallSingleWork =
    placementCount === 1 &&
    preset.roomDepth > 10 &&
    (!existingSize || Math.max(...existingSize) <= 1.8);
  const size = isLegacySmallSingleWork
    ? getDefaultMuseumArtworkSize(preset)
    : existingSize ?? getDefaultMuseumArtworkSize(preset);

  return {
    position: isLegacySmallSingleWork
      ? getDefaultMuseumArtworkPosition({ preset, size })
      : placement.position ??
        getDefaultPlacementPosition({ index, placementCount, preset, size }),
    rotation: placement.rotation ?? [0, 0, 0],
    size,
  };
}

function getDefaultMuseumArtworkSize(
  preset: ReturnType<typeof getCmsRoomPreset>
): readonly [number, number] {
  const size = Math.min(8.2, preset.wallHeight - 1.55, preset.roomWidth * 0.42);
  return [size, size];
}

function getDefaultMuseumArtworkPosition({
  preset,
  size,
}: {
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly size: readonly [number, number];
}): readonly [number, number, number] {
  return [
    0,
    Math.min(preset.wallHeight - size[1] / 2 - 0.65, preset.wallHeight * 0.52),
    -preset.roomDepth / 2 + 0.09,
  ];
}

function createMissingArtworkTexture({
  THREE,
  label,
}: {
  readonly THREE: ThreeModule;
  readonly label: string;
}): Texture {
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, "#10141c");
    gradient.addColorStop(1, "#293342");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 1024);
    context.strokeStyle = "rgba(255,255,255,0.2)";
    context.lineWidth = 20;
    context.strokeRect(48, 48, 928, 928);
    context.fillStyle = "#f8f5ec";
    context.font = "700 132px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText("6529", 512, 470);
    context.font = "500 42px Arial, sans-serif";
    context.fillText(label.slice(0, 34), 512, 555);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function addArtworkPlaque({
  THREE,
  fitted,
  label,
  preset,
  rotation,
  scene,
  x,
  y,
  z,
}: {
  readonly THREE: ThreeModule;
  readonly fitted: ReturnType<typeof fitArtworkToFrame>;
  readonly label: string;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly rotation: readonly [number, number, number];
  readonly scene: Scene;
  readonly x: number;
  readonly y: number;
  readonly z: number;
}): void {
  const plaqueTexture = createPlaqueTexture({ THREE, label, preset });
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(1.9, Math.max(0.95, fitted.width * 0.34)), 0.22),
    new THREE.MeshBasicMaterial({
      map: plaqueTexture,
      side: THREE.DoubleSide,
      transparent: true,
    })
  );
  plaque.position.set(x + fitted.width / 2 - 0.7, y, z);
  plaque.rotation.set(...rotation);
  scene.add(plaque);
}

function createPlaqueTexture({
  THREE,
  label,
  preset,
}: {
  readonly THREE: ThreeModule;
  readonly label: string;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
}): Texture {
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "rgba(250,248,241,0.92)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(34,37,34,0.16)";
    context.lineWidth = 4;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    context.fillStyle = preset.labelColor;
    context.font = "600 30px Arial, sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(label.slice(0, 26), 28, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

async function addArtworkPlacement({
  THREE,
  clickable,
  index,
  placementCount,
  placement,
  preset,
  scene,
}: {
  readonly THREE: ThreeModule;
  readonly clickable: CmsThreeDClickable[];
  readonly index: number;
  readonly placementCount: number;
  readonly placement: CmsThreeDPlacement;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly scene: Scene;
}): Promise<void> {
  const transform = getRoomArtworkTransform({
    index,
    placement,
    placementCount,
    preset,
  });
  const [boxWidth, boxHeight] = transform.size;
  const fitted = fitArtworkToFrame({
    frameHeight: boxHeight,
    frameWidth: boxWidth,
    naturalHeight: placement.asset.height,
    naturalWidth: placement.asset.width,
  });
  const [x, y, z] = transform.position;
  const [rotationX, rotationY, rotationZ] = transform.rotation;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(fitted.width + 0.48, fitted.height + 0.48, 0.22),
    new THREE.MeshStandardMaterial({
      color: "#080806",
      metalness: 0.26,
      roughness: 0.28,
    })
  );
  frame.castShadow = true;
  frame.receiveShadow = true;
  frame.position.set(x, y, z - 0.11);
  frame.rotation.set(rotationX, rotationY, rotationZ);
  scene.add(frame);

  const innerFrame = new THREE.Mesh(
    new THREE.BoxGeometry(fitted.width + 0.25, fitted.height + 0.25, 0.12),
    new THREE.MeshStandardMaterial({
      color: "#a98955",
      metalness: 0.54,
      roughness: 0.24,
    })
  );
  innerFrame.castShadow = true;
  innerFrame.receiveShadow = true;
  innerFrame.position.set(x, y, z - 0.045);
  innerFrame.rotation.set(rotationX, rotationY, rotationZ);
  scene.add(innerFrame);

  const texture = await loadTexture(THREE, placement.asset.url).catch(
    () => null
  );
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }
  const fallbackTexture = texture
    ? null
    : createMissingArtworkTexture({ THREE, label: placement.label });
  const artworkTexture = texture ?? fallbackTexture;

  const mount = new THREE.Mesh(
    new THREE.PlaneGeometry(fitted.width + 0.06, fitted.height + 0.06),
    new THREE.MeshStandardMaterial({
      color: "#fbf7ef",
      roughness: 0.72,
      side: THREE.DoubleSide,
    })
  );
  mount.receiveShadow = true;
  mount.position.set(x, y, z + 0.002);
  mount.rotation.set(rotationX, rotationY, rotationZ);
  scene.add(mount);

  const material =
    placement.displayMode === "faithful"
      ? new THREE.MeshBasicMaterial({
          color: "#ffffff",
          map: artworkTexture,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshStandardMaterial({
          color: "#ffffff",
          map: artworkTexture,
          roughness: 0.65,
          side: THREE.DoubleSide,
        });

  const artwork = new THREE.Mesh(
    new THREE.PlaneGeometry(fitted.width, fitted.height),
    material
  );
  artwork.position.set(x, y, z + 0.022);
  artwork.rotation.set(rotationX, rotationY, rotationZ);
  artwork.name = placement.label;
  scene.add(artwork);
  addArtworkPlaque({
    THREE,
    fitted,
    label: placement.label,
    preset,
    rotation: [rotationX, rotationY, rotationZ],
    scene,
    x,
    y: y - fitted.height / 2 - 0.2,
    z: z + 0.028,
  });
  clickable.push({ href: placement.detailHref, object: artwork });
}

async function buildObjectScene({
  THREE,
  camera,
  config,
  onProgress,
  scene,
}: {
  readonly THREE: ThreeModule;
  readonly camera: PerspectiveCamera;
  readonly config: Extract<CmsThreeDViewerConfig, { readonly kind: "object" }>;
  readonly onProgress: (progress: number) => void;
  readonly scene: Scene;
}): Promise<void> {
  scene.background = new THREE.Color("#050505");
  scene.add(new THREE.AmbientLight("#ffffff", 0.8));
  const light = new THREE.DirectionalLight("#ffffff", 1.1);
  light.position.set(2, 3, 4);
  scene.add(light);

  const { GLTFLoader } =
    await import("three/examples/jsm/loaders/GLTFLoader.js");
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => {
    if (total > 0) {
      onProgress(Math.min(95, (loaded / total) * 95));
    }
  };

  const loader = new GLTFLoader(manager);
  const gltf = await loader.loadAsync(config.asset.url);
  const model = gltf.scene;
  scene.add(model);

  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.1);
  model.position.sub(center);
  model.scale.setScalar(2.1 / maxDimension);
  camera.position.set(0, 0.9, 3.6);
}

function getDefaultPlacementPosition({
  index,
  placementCount,
  preset,
  size,
}: {
  readonly index: number;
  readonly placementCount: number;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly size: readonly [number, number];
}): readonly [number, number, number] {
  if (placementCount === 1) {
    return getDefaultMuseumArtworkPosition({ preset, size });
  }

  const columns = Math.min(3, placementCount);
  const step = Math.min(size[0] + 0.72, preset.roomWidth / columns);
  const firstX = -((columns - 1) * step) / 2;
  const row = Math.floor(index / columns);
  const column = index % columns;
  return [
    firstX + column * step,
    Math.min(preset.wallHeight - size[1] / 2 - 0.5, preset.wallHeight * 0.56) -
      row * (size[1] + 0.58),
    -preset.roomDepth / 2 + 0.09,
  ];
}

function loadTexture(THREE: ThreeModule, url: string): Promise<Texture> {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  return loader.loadAsync(url);
}

function resizeRenderer({
  camera,
  container,
  renderer,
}: {
  readonly camera: PerspectiveCamera;
  readonly container: HTMLElement;
  readonly renderer: WebGLRenderer;
}) {
  const rect = container.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function disposeScene(scene: Scene): void {
  scene.traverse((object) => {
    if (!isMesh(object)) {
      return;
    }

    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    materials.forEach(disposeMaterial);
  });
}

function disposeMaterial(material: Material): void {
  Object.values(material).forEach((value) => {
    if (isTexture(value)) {
      value.dispose();
    }
  });
  material.dispose();
}

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function isTexture(value: unknown): value is Texture {
  return (
    typeof value === "object" &&
    value !== null &&
    "isTexture" in value &&
    (value as { readonly isTexture?: boolean }).isTexture === true
  );
}
