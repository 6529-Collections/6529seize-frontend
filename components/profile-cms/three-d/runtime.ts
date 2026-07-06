import type { CmsThreeDViewerConfig } from "@/components/profile-cms/CmsThreeDTypes";
import { getCmsRoomPreset } from "@/lib/profile-cms/runtime/threeD";
import type {
  CmsThreeDClickable,
  CmsThreeDRuntime,
} from "@/components/profile-cms/three-d/types";
import { createRoomNavigation } from "@/components/profile-cms/three-d/roomNavigation";
import { buildObjectScene } from "@/components/profile-cms/three-d/objectScene";
import { buildRoomScene } from "@/components/profile-cms/three-d/roomScene";
import {
  disposeScene,
  resizeRenderer,
} from "@/components/profile-cms/three-d/sceneUtils";

export async function createCmsThreeDRuntime({
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
