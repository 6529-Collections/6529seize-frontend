declare module "three" {
  export const DoubleSide: number;
  export const ACESFilmicToneMapping: number;
  export const PCFSoftShadowMap: number;
  export const RepeatWrapping: number;
  export const SRGBColorSpace: string;

  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    addScaledVector(vector: Vector3, scale: number): this;
    lengthSq(): number;
    multiplyScalar(scale: number): this;
    normalize(): this;
    set(x: number, y: number, z: number): this;
    setScalar(scale: number): this;
    sub(vector: Vector3): this;
  }

  export class Euler {
    x: number;
    y: number;
    z: number;
    order: string;
    set(x: number, y: number, z: number): this;
  }

  export class Color {
    constructor(color: string | number);
  }

  export class Clock {
    constructor(autoStart?: boolean);
    getDelta(): number;
  }

  export class Object3D {
    name: string;
    parent: Object3D | null;
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    add(...objects: Object3D[]): this;
    traverse(callback: (object: Object3D) => void): void;
  }

  export class Camera extends Object3D {}

  export class PerspectiveCamera extends Camera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    aspect: number;
    updateProjectionMatrix(): void;
  }

  export class Scene extends Object3D {
    background: Color | null;
    fog: Fog | null;
  }

  export class Fog {
    constructor(color: string | number, near?: number, far?: number);
  }

  export class BufferGeometry {
    dispose(): void;
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number);
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, depth?: number);
  }

  export class CylinderGeometry extends BufferGeometry {
    constructor(
      radiusTop?: number,
      radiusBottom?: number,
      height?: number,
      radialSegments?: number
    );
  }

  export class Texture {
    readonly isTexture: boolean;
    anisotropy: number;
    colorSpace: string;
    repeat: {
      set(x: number, y: number): void;
    };
    wrapS: number;
    wrapT: number;
    clone(): Texture;
    dispose(): void;
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement);
  }

  export class TextureLoader {
    setCrossOrigin(crossOrigin: string): this;
    loadAsync(url: string): Promise<Texture>;
  }

  export class Material {
    [key: string]: unknown;
    dispose(): void;
  }

  export interface MaterialOptions {
    color?: string | number | undefined;
    map?: Texture | null | undefined;
    metalness?: number | undefined;
    opacity?: number | undefined;
    roughness?: number | undefined;
    side?: number | undefined;
    transparent?: boolean | undefined;
  }

  export class MeshBasicMaterial extends Material {
    constructor(options?: MaterialOptions);
  }

  export class MeshStandardMaterial extends Material {
    constructor(options?: MaterialOptions);
  }

  export class Mesh extends Object3D {
    constructor(
      geometry?: BufferGeometry,
      material?: Material | readonly Material[]
    );
    readonly isMesh: boolean;
    castShadow: boolean;
    geometry: BufferGeometry;
    material: Material | readonly Material[];
    receiveShadow: boolean;
  }

  export class AmbientLight extends Object3D {
    constructor(color?: string | number, intensity?: number);
  }

  export class DirectionalLight extends Object3D {
    constructor(color?: string | number, intensity?: number);
    castShadow: boolean;
    shadow: {
      mapSize: {
        height: number;
        width: number;
      };
    };
  }

  export class HemisphereLight extends Object3D {
    constructor(
      skyColor?: string | number,
      groundColor?: string | number,
      intensity?: number
    );
  }

  export class SpotLight extends Object3D {
    constructor(
      color?: string | number,
      intensity?: number,
      distance?: number,
      angle?: number,
      penumbra?: number,
      decay?: number
    );
    castShadow: boolean;
    shadow: {
      mapSize: {
        height: number;
        width: number;
      };
    };
    target: Object3D;
  }

  export class RectAreaLight extends Object3D {
    constructor(
      color?: string | number,
      intensity?: number,
      width?: number,
      height?: number
    );
  }

  export class Box3 {
    setFromObject(object: Object3D): this;
    getSize(target: Vector3): Vector3;
    getCenter(target: Vector3): Vector3;
  }

  export interface Intersection {
    readonly object: Object3D;
  }

  export class Raycaster {
    setFromCamera(pointer: Vector2, camera: Camera): void;
    intersectObjects(
      objects: readonly Object3D[],
      recursive?: boolean
    ): Intersection[];
  }

  export class LoadingManager {
    onProgress?:
      | ((url: string, loaded: number, total: number) => void)
      | undefined;
  }

  export class WebGLRenderer {
    constructor(options?: {
      readonly antialias?: boolean | undefined;
      readonly canvas?: HTMLCanvasElement | undefined;
      readonly powerPreference?:
        | "default"
        | "high-performance"
        | "low-power"
        | undefined;
    });
    outputColorSpace: string;
    shadowMap: {
      enabled: boolean;
      type: number;
    };
    toneMapping: number;
    toneMappingExposure: number;
    dispose(): void;
    render(scene: Scene, camera: Camera): void;
    setPixelRatio(ratio: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
  }
}

declare module "three/examples/jsm/controls/OrbitControls.js" {
  import type { Camera } from "three";

  export class OrbitControls {
    constructor(camera: Camera, domElement: HTMLElement);
    dampingFactor: number;
    enableDamping: boolean;
    enablePan: boolean;
    maxDistance: number;
    minDistance: number;
    readonly target: {
      set(x: number, y: number, z: number): void;
    };
    dispose(): void;
    update(): boolean;
  }
}

declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  import type { LoadingManager, Object3D } from "three";

  export class GLTFLoader {
    constructor(manager?: LoadingManager);
    loadAsync(url: string): Promise<{
      readonly scene: Object3D;
    }>;
  }
}
