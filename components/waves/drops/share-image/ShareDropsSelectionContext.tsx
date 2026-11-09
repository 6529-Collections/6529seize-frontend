"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  DropSize,
  type Drop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { MAX_SHARE_IMAGE_POSTS } from "@/lib/share-drops-image/shareDropsImageFormat";
import ShareDropsImageDialog from "./ShareDropsImageDialog";
import ShareDropsSelectionBar from "./ShareDropsSelectionBar";

type Step = "idle" | "selecting" | "options";

interface ShareDropsSelectionValue {
  readonly isSelecting: boolean;
  readonly isSelected: (serialNo: number) => boolean;
  /** "first" / "last" for the ends of a multi-post range, otherwise null. */
  readonly getEndpoint: (serialNo: number) => "first" | "last" | null;
  /** Starts selecting with this post as the first one. */
  readonly start: (serialNo: number) => void;
  /** Sets the last post; selecting the first post again keeps just it. */
  readonly choose: (serialNo: number) => void;
}

interface ShareDropsLayerValue {
  readonly step: Step;
  readonly wave: ApiWave | null | undefined;
  readonly selected: readonly ExtendedDrop[];
  readonly cancel: () => void;
  readonly setStep: (step: Step) => void;
}

const ShareDropsSelectionContext =
  createContext<ShareDropsSelectionValue | null>(null);
const ShareDropsLayerContext = createContext<ShareDropsLayerValue | null>(null);

/** Null outside a wave conversation, where "Share as image" is not offered. */
export function useShareDropsSelection(): ShareDropsSelectionValue | null {
  return useContext(ShareDropsSelectionContext);
}

function isFullDrop(drop: Drop): drop is ExtendedDrop {
  return drop.type === DropSize.FULL;
}

/**
 * "Share as image" for a wave conversation: pick the first post from its menu,
 * then the last post in the list; everything between is included. Next opens
 * the options and preview. Everything renders on the device.
 */
export function ShareDropsSelectionProvider({
  wave,
  drops,
  children,
}: {
  readonly wave: ApiWave | null | undefined;
  readonly drops: readonly Drop[];
  readonly children: ReactNode;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [firstSerial, setFirstSerial] = useState<number | null>(null);
  const [lastSerial, setLastSerial] = useState<number | null>(null);

  const range = useMemo(() => {
    if (firstSerial === null) return null;
    const end = lastSerial ?? firstSerial;
    return {
      low: Math.min(firstSerial, end),
      high: Math.max(firstSerial, end),
    };
  }, [firstSerial, lastSerial]);

  const selected = useMemo(
    () =>
      range === null
        ? []
        : drops
            .filter(isFullDrop)
            .filter(
              (drop) =>
                drop.serial_no >= range.low && drop.serial_no <= range.high
            )
            .sort((a, b) => a.serial_no - b.serial_no),
    [drops, range]
  );

  const cancel = useCallback(() => {
    setStep("idle");
    setFirstSerial(null);
    setLastSerial(null);
  }, []);

  const selection = useMemo<ShareDropsSelectionValue>(
    () => ({
      isSelecting: step === "selecting",
      isSelected: (serialNo) =>
        range !== null && serialNo >= range.low && serialNo <= range.high,
      getEndpoint: (serialNo) => {
        if (range === null || range.low === range.high) return null;
        if (serialNo === range.low) return "first";
        if (serialNo === range.high) return "last";
        return null;
      },
      start: (serialNo) => {
        setFirstSerial(serialNo);
        setLastSerial(null);
        setStep("selecting");
      },
      choose: (serialNo) => {
        setLastSerial(serialNo === firstSerial ? null : serialNo);
      },
    }),
    [firstSerial, range, step]
  );
  const layer = useMemo<ShareDropsLayerValue>(
    () => ({ step, wave, selected, cancel, setStep }),
    [cancel, selected, step, wave]
  );

  return (
    <ShareDropsSelectionContext.Provider value={selection}>
      <ShareDropsLayerContext.Provider value={layer}>
        {children}
      </ShareDropsLayerContext.Provider>
    </ShareDropsSelectionContext.Provider>
  );
}

/**
 * The selection bar and the options dialog. Render it inside the positioned
 * conversation container, so the bar overlays the posts.
 */
export function ShareDropsSelectionLayer() {
  const layer = useContext(ShareDropsLayerContext);
  if (!layer) return null;
  const { step, wave, selected, cancel, setStep } = layer;

  if (step === "selecting") {
    return (
      <ShareDropsSelectionBar
        count={selected.length}
        isTooLong={selected.length > MAX_SHARE_IMAGE_POSTS}
        onCancel={cancel}
        onNext={() => setStep("options")}
      />
    );
  }
  if (step === "options" && wave && selected.length > 0) {
    return (
      <ShareDropsImageDialog
        wave={wave}
        drops={selected}
        onBack={() => setStep("selecting")}
        onClose={cancel}
      />
    );
  }
  return null;
}
