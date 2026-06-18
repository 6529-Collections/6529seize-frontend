"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
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

  const onCanvasPointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const runtime = runtimeRef.current;
      const canvas = canvasRef.current;
      if (!runtime || !canvas || !runtime.clickable.length) {
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
      className="tw-relative tw-min-h-[480px] tw-w-full tw-overflow-hidden tw-bg-black md:tw-min-h-[620px]"
      data-cms-3d-kind={config.kind}
      data-cms-3d-status={isMobileFallback ? "mobile-fallback" : status}
    >
      <div className="tw-absolute tw-inset-0" ref={containerRef}>
        <canvas
          aria-label={t(locale, "profileCms.interactive.canvasLabel")}
          className="tw-h-full tw-w-full"
          data-testid="cms-3d-canvas"
          onPointerUp={onCanvasPointerUp}
          ref={canvasRef}
        />
      </div>

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

  query.addListener(listener);
  return () => query.removeListener(listener);
}

function getSelectedCmsThreeDClickable({
  canvas,
  event,
  runtime,
}: {
  readonly canvas: HTMLCanvasElement;
  readonly event: PointerEvent<HTMLCanvasElement>;
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
      className="tw-absolute tw-bottom-4 tw-left-4 tw-right-4 tw-z-20 tw-flex tw-flex-wrap tw-gap-2"
    >
      {config.placements.map((placement) => (
        <a
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-bg-black/80 tw-px-3 tw-text-sm tw-font-semibold tw-text-white hover:tw-text-primary-300"
          href={placement.detailHref}
          key={placement.id}
        >
          {placement.label}
        </a>
      ))}
      {config.fallbackHref ? (
        <a
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-bg-black/80 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-text-white"
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
  const { OrbitControls } =
    await import("three/examples/jsm/controls/OrbitControls.js");
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
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

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !prefersReducedMotion;
  controls.dampingFactor = 0.08;
  controls.enablePan = config.kind === "object";
  controls.maxDistance = config.kind === "room" ? 8 : 10;
  controls.minDistance = config.kind === "room" ? 2.2 : 1.2;

  if (config.kind === "room") {
    const preset = getCmsRoomPreset(config.preset);
    camera.position.set(...preset.camera);
    controls.target.set(0, 1.4, -preset.roomDepth / 2);
  } else {
    camera.position.set(0, 1.2, 4);
    controls.target.set(0, 0.8, 0);
  }

  const resize = () => {
    resizeRenderer({ camera, container, renderer });
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  let frameId = 0;
  const renderFrame = () => {
    controls.update();
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
      controls.dispose();
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
  scene.background = new THREE.Color(preset.wallColor);
  scene.add(
    new THREE.AmbientLight(
      "#ffffff",
      config.preset === "dark_room" ? 0.55 : 0.75
    )
  );

  const keyLight = new THREE.DirectionalLight("#ffffff", 1.1);
  keyLight.position.set(2, 4, 3);
  scene.add(keyLight);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: preset.wallColor,
    roughness: 0.85,
  });
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: preset.floorColor,
    roughness: 0.9,
  });

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(preset.roomWidth, preset.wallHeight),
    wallMaterial
  );
  backWall.position.set(0, preset.wallHeight / 2, -preset.roomDepth / 2);
  scene.add(backWall);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(preset.roomWidth, preset.roomDepth),
    floorMaterial
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -preset.roomDepth / 4;
  scene.add(floor);

  const sideWallGeometry = new THREE.PlaneGeometry(
    preset.roomDepth,
    preset.wallHeight
  );
  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(
    -preset.roomWidth / 2,
    preset.wallHeight / 2,
    -preset.roomDepth / 4
  );
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(
    preset.roomWidth / 2,
    preset.wallHeight / 2,
    -preset.roomDepth / 4
  );
  scene.add(rightWall);

  await Promise.all(
    config.placements.map((placement, index) =>
      addArtworkPlacement({
        THREE,
        clickable,
        index,
        placement,
        preset,
        scene,
      })
    )
  );
}

async function addArtworkPlacement({
  THREE,
  clickable,
  index,
  placement,
  preset,
  scene,
}: {
  readonly THREE: ThreeModule;
  readonly clickable: CmsThreeDClickable[];
  readonly index: number;
  readonly placement: CmsThreeDPlacement;
  readonly preset: ReturnType<typeof getCmsRoomPreset>;
  readonly scene: Scene;
}): Promise<void> {
  const [boxWidth, boxHeight] = placement.size ?? [1.35, 1.35];
  const fitted = fitArtworkToFrame({
    frameHeight: boxHeight,
    frameWidth: boxWidth,
    naturalHeight: placement.asset.height,
    naturalWidth: placement.asset.width,
  });
  const [x, y, z] = placement.position ?? getDefaultPlacementPosition(index);
  const [rotationX, rotationY, rotationZ] = placement.rotation ?? [0, 0, 0];

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(fitted.width + 0.16, fitted.height + 0.16, 0.07),
    new THREE.MeshStandardMaterial({
      color: preset.frameColor,
      metalness: 0.05,
      roughness: 0.5,
    })
  );
  frame.position.set(x, y, z - 0.035);
  frame.rotation.set(rotationX, rotationY, rotationZ);
  scene.add(frame);

  const texture = await loadTexture(THREE, placement.asset.url).catch(
    () => null
  );
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  const surfaceColor = texture ? "#ffffff" : "#20242c";

  const material =
    placement.displayMode === "faithful"
      ? new THREE.MeshBasicMaterial({
          color: surfaceColor,
          map: texture,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshStandardMaterial({
          color: surfaceColor,
          map: texture,
          roughness: 0.65,
          side: THREE.DoubleSide,
        });

  const artwork = new THREE.Mesh(
    new THREE.PlaneGeometry(fitted.width, fitted.height),
    material
  );
  artwork.position.set(x, y, z + 0.012);
  artwork.rotation.set(rotationX, rotationY, rotationZ);
  artwork.name = placement.label;
  scene.add(artwork);
  if (!texture) {
    addMissingArtworkCue({
      THREE,
      fitted,
      rotation: [rotationX, rotationY, rotationZ],
      scene,
      x,
      y,
      z: z + 0.018,
    });
  }
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

function getDefaultPlacementPosition(
  index: number
): readonly [number, number, number] {
  const xPositions = [-1.45, 0, 1.45];
  const row = Math.floor(index / xPositions.length);
  const column = index % xPositions.length;
  return [xPositions[column] ?? 0, 1.55 - row * 0.58, -2.42];
}

function loadTexture(THREE: ThreeModule, url: string): Promise<Texture> {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  return loader.loadAsync(url);
}

function addMissingArtworkCue({
  THREE,
  fitted,
  rotation,
  scene,
  x,
  y,
  z,
}: {
  readonly THREE: ThreeModule;
  readonly fitted: ReturnType<typeof fitArtworkToFrame>;
  readonly rotation: readonly [number, number, number];
  readonly scene: Scene;
  readonly x: number;
  readonly y: number;
  readonly z: number;
}): void {
  const diagonalLength = Math.hypot(fitted.width, fitted.height);
  const barThickness = Math.max(
    0.03,
    Math.min(fitted.width, fitted.height) * 0.06
  );
  const angle = Math.atan2(fitted.height, fitted.width);
  addMissingArtworkCueBar({
    THREE,
    angle,
    diagonalLength,
    position: [x, y, z],
    rotation,
    scene,
    thickness: barThickness,
  });
  addMissingArtworkCueBar({
    THREE,
    angle: -angle,
    diagonalLength,
    position: [x, y, z + 0.002],
    rotation,
    scene,
    thickness: barThickness,
  });
}

function addMissingArtworkCueBar({
  THREE,
  angle,
  diagonalLength,
  position,
  rotation,
  scene,
  thickness,
}: {
  readonly THREE: ThreeModule;
  readonly angle: number;
  readonly diagonalLength: number;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scene: Scene;
  readonly thickness: number;
}): void {
  const [x, y, z] = position;
  const [rotationX, rotationY, rotationZ] = rotation;
  const bar = new THREE.Mesh(
    new THREE.PlaneGeometry(diagonalLength, thickness),
    new THREE.MeshBasicMaterial({
      color: "#ef4444",
      side: THREE.DoubleSide,
    })
  );
  bar.position.set(x, y, z);
  bar.rotation.set(rotationX, rotationY, rotationZ + angle);
  scene.add(bar);
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
