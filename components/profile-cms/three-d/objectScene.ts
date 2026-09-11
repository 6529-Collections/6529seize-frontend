import type { PerspectiveCamera, Scene } from "three";

import type { CmsThreeDViewerConfig } from "@/components/profile-cms/CmsThreeDTypes";
import type { ThreeModule } from "@/components/profile-cms/three-d/types";

export async function buildObjectScene({
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
