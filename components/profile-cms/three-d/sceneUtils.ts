import type {
  Material,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  Texture,
  WebGLRenderer,
} from "three";

import type { ThreeModule } from "@/components/profile-cms/three-d/types";

export function loadTexture(THREE: ThreeModule, url: string): Promise<Texture> {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  return loader.loadAsync(url);
}

export function resizeRenderer({
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

export function disposeScene(scene: Scene): void {
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
