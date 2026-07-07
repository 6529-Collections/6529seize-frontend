import type { PerspectiveCamera } from "three";

import { getCmsRoomPreset } from "@/lib/profile-cms/runtime/threeD";
import type { ThreeModule } from "@/components/profile-cms/three-d/types";

type CmsRoomNavigation = {
  readonly dispose: () => void;
  readonly update: (delta: number) => void;
};

const ROOM_EYE_HEIGHT = 1.78;
const ROOM_GRAVITY = 10.5;
const ROOM_JUMP_VELOCITY = 3.8;
const ROOM_LOOK_SENSITIVITY = 0.0022;

export function createRoomNavigation({
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
