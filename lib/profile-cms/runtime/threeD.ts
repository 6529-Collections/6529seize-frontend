export type CmsRoomPreset = "wall" | "salon" | "white_cube" | "dark_room";

export type CmsRoomPresetConfig = {
  readonly key: CmsRoomPreset;
  readonly wallColor: string;
  readonly floorColor: string;
  readonly frameColor: string;
  readonly labelColor: string;
  readonly camera: readonly [number, number, number];
  readonly roomDepth: number;
  readonly roomWidth: number;
  readonly wallHeight: number;
};

export type CmsArtworkFit = {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
};

const ROOM_PRESETS: Record<CmsRoomPreset, CmsRoomPresetConfig> = {
  wall: {
    key: "wall",
    wallColor: "#f5f1e8",
    floorColor: "#c9c2b4",
    frameColor: "#111111",
    labelColor: "#1f2933",
    camera: [0, 1.55, 4.4],
    roomDepth: 4.8,
    roomWidth: 5.6,
    wallHeight: 3.2,
  },
  salon: {
    key: "salon",
    wallColor: "#2f3a36",
    floorColor: "#171a18",
    frameColor: "#d6b46c",
    labelColor: "#f2e7c9",
    camera: [0, 1.65, 4.8],
    roomDepth: 5.4,
    roomWidth: 6.2,
    wallHeight: 3.5,
  },
  white_cube: {
    key: "white_cube",
    wallColor: "#f1eadf",
    floorColor: "#d8ceba",
    frameColor: "#0f172a",
    labelColor: "#2e332e",
    camera: [-4.2, 1.85, 6.2],
    roomDepth: 32,
    roomWidth: 23,
    wallHeight: 10.5,
  },
  dark_room: {
    key: "dark_room",
    wallColor: "#121212",
    floorColor: "#050505",
    frameColor: "#d1d5db",
    labelColor: "#e5e7eb",
    camera: [0, 1.55, 4.2],
    roomDepth: 4.8,
    roomWidth: 5.4,
    wallHeight: 3.1,
  },
};

export function getCmsRoomPreset(
  value: string | null | undefined
): CmsRoomPresetConfig {
  return isCmsRoomPreset(value) ? ROOM_PRESETS[value] : ROOM_PRESETS.wall;
}

export function isCmsRoomPreset(
  value: string | null | undefined
): value is CmsRoomPreset {
  return (
    value === "wall" ||
    value === "salon" ||
    value === "white_cube" ||
    value === "dark_room"
  );
}

export function fitArtworkToFrame({
  frameHeight,
  frameWidth,
  naturalHeight,
  naturalWidth,
}: {
  readonly frameHeight: number;
  readonly frameWidth: number;
  readonly naturalHeight?: number | undefined;
  readonly naturalWidth?: number | undefined;
}): CmsArtworkFit {
  const safeFrameWidth = Math.max(frameWidth, 0.1);
  const safeFrameHeight = Math.max(frameHeight, 0.1);
  const aspectRatio =
    naturalWidth && naturalHeight && naturalWidth > 0 && naturalHeight > 0
      ? naturalWidth / naturalHeight
      : safeFrameWidth / safeFrameHeight;
  const frameAspectRatio = safeFrameWidth / safeFrameHeight;

  if (aspectRatio >= frameAspectRatio) {
    return {
      width: safeFrameWidth,
      height: safeFrameWidth / aspectRatio,
      aspectRatio,
    };
  }

  return {
    width: safeFrameHeight * aspectRatio,
    height: safeFrameHeight,
    aspectRatio,
  };
}

export function getCmsPerformanceBudgetBytes(
  budget: Record<string, unknown> | undefined
): number | undefined {
  const value =
    budget?.["max_model_bytes"] ??
    budget?.["max_asset_bytes"] ??
    budget?.["max_bytes"];

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
}
