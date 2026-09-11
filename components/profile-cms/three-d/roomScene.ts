import type { Material, Scene, Texture } from "three";

import type { CmsThreeDViewerConfig } from "@/components/profile-cms/CmsThreeDTypes";
import { getCmsRoomPreset } from "@/lib/profile-cms/runtime/threeD";
import { addArtworkPlacement } from "@/components/profile-cms/three-d/roomArtwork";
import type {
  CmsThreeDClickable,
  ThreeModule,
} from "@/components/profile-cms/three-d/types";

export async function buildRoomScene({
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
  artSpot.position.set(
    0,
    preset.wallHeight - 0.62,
    -preset.roomDepth / 2 + 6.4
  );
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
  leftCove.position.set(
    -preset.roomWidth / 2 + 0.24,
    preset.wallHeight - 0.45,
    0
  );
  leftCove.rotation.set(0, Math.PI / 2, 0);
  scene.add(leftCove);

  const rightCove = new THREE.RectAreaLight(
    "#ffe8bd",
    5.2,
    preset.roomDepth * 0.74,
    0.48
  );
  rightCove.position.set(
    preset.roomWidth / 2 - 0.24,
    preset.wallHeight - 0.45,
    0
  );
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

  const gradient = context.createLinearGradient(
    0,
    0,
    canvas.width,
    canvas.height
  );
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

function createWallGlowTexture({
  THREE,
}: {
  readonly THREE: ThreeModule;
}): Texture {
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

  const gradient = context.createLinearGradient(
    0,
    0,
    canvas.width,
    canvas.height
  );
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
