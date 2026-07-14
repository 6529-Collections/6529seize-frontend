import type {
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";

export type ThreeModule = typeof import("three");

export type CmsThreeDStatus = "idle" | "loading" | "ready" | "error";

export type CmsThreeDClickable = {
  readonly href: string;
  readonly object: Object3D;
};

export type CmsThreeDRuntime = {
  readonly THREE: ThreeModule;
  readonly camera: PerspectiveCamera;
  readonly cleanup: () => void;
  readonly clickable: readonly CmsThreeDClickable[];
  readonly pointer: Vector2;
  readonly raycaster: Raycaster;
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
};

export type LegacyMediaQueryList = {
  readonly addListener?: ((listener: () => void) => void) | undefined;
  readonly removeListener?: ((listener: () => void) => void) | undefined;
};
