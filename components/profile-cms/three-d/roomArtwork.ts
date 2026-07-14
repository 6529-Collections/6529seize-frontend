import type { Scene, Texture } from "three";

import type { CmsThreeDPlacement } from "@/components/profile-cms/CmsThreeDTypes";
import {
  fitArtworkToFrame,
  getCmsRoomPreset,
} from "@/lib/profile-cms/runtime/threeD";
import { getProfileCmsAssetProxyUrl } from "@/lib/profile-cms/runtime/mediaProxy";
import { loadTexture } from "@/components/profile-cms/three-d/sceneUtils";
import type {
  CmsThreeDClickable,
  ThreeModule,
} from "@/components/profile-cms/three-d/types";

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
    : (existingSize ?? getDefaultMuseumArtworkSize(preset));

  return {
    position: isLegacySmallSingleWork
      ? getDefaultMuseumArtworkPosition({ preset, size })
      : (placement.position ??
        getDefaultPlacementPosition({ index, placementCount, preset, size })),
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
    new THREE.PlaneGeometry(
      Math.min(1.9, Math.max(0.95, fitted.width * 0.34)),
      0.22
    ),
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

export async function addArtworkPlacement({
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

  const texture = await loadTexture(
    THREE,
    getProfileCmsAssetProxyUrl(placement.asset.url)
  ).catch(() => null);
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
