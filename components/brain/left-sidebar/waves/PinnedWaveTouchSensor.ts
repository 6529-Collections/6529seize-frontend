import { TouchSensor, type Activators, type SensorProps } from "@dnd-kit/core";
import type { TouchEvent as ReactTouchEvent } from "react";

interface Options {
  readonly delay: number;
}

/** A stationary hold belongs to the row menu, not the reorder sensor. */
export class PinnedWaveTouchSensor {
  autoScrollEnabled = true;
  private readonly props: SensorProps<Options>;
  private readonly initial: { x: number; y: number; id: number };
  private readonly started = performance.now();
  private activated = false;
  private finished = false;

  static activators: Activators<Options> = [
    {
      eventName: "onTouchStart",
      handler: ({ nativeEvent }: ReactTouchEvent) =>
        nativeEvent.touches.length === 1,
    },
  ];
  static setup() {
    return TouchSensor.setup();
  }

  constructor(props: SensorProps<Options>) {
    this.props = props;
    const touch = (props.event as TouchEvent).touches[0]!;
    this.initial = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
    document.addEventListener("touchmove", this.move, { passive: false });
    document.addEventListener("touchend", this.end);
    document.addEventListener("touchcancel", this.cancel);
    document.addEventListener("touchstart", this.additionalTouch);
    document.addEventListener("keydown", this.keydown);
    globalThis.addEventListener("blur", this.cancel);
  }

  private readonly move = (event: TouchEvent) => {
    const target = this.props.event.target;
    if (
      target instanceof Element &&
      target.closest('[data-wave-menu-open="true"]')
    ) {
      this.cancel();
      return;
    }
    const touch = event.touches[0];
    if (
      !touch ||
      event.touches.length !== 1 ||
      touch.identifier !== this.initial.id
    ) {
      this.cancel();
      return;
    }
    const dx = Math.abs(touch.clientX - this.initial.x);
    const dy = Math.abs(touch.clientY - this.initial.y);
    if (!this.activated) {
      if (Math.max(dx, dy) < 8) return;
      if (
        performance.now() - this.started < this.props.options.delay ||
        dx >= dy
      ) {
        this.cancel();
        return;
      }
      if (dy < dx * 1.5 || !event.cancelable) return;
      this.activated = true;
      this.props.onStart(this.initial);
    }
    if (event.cancelable) event.preventDefault();
    this.props.onMove({ x: touch.clientX, y: touch.clientY });
  };

  private readonly additionalTouch = (event: TouchEvent) => {
    if (event.touches.length !== 1) this.cancel();
  };

  private readonly keydown = (event: KeyboardEvent) => {
    if (event.code === "Escape") this.cancel();
  };

  private detach() {
    this.finished = true;
    document.removeEventListener("touchmove", this.move);
    document.removeEventListener("touchend", this.end);
    document.removeEventListener("touchcancel", this.cancel);
    document.removeEventListener("touchstart", this.additionalTouch);
    document.removeEventListener("keydown", this.keydown);
    globalThis.removeEventListener("blur", this.cancel);
    if (!this.activated) this.props.onAbort(this.props.active);
  }

  private readonly end = () => {
    if (this.finished) return;
    this.detach();
    this.props.onEnd();
  };

  private readonly cancel = () => {
    if (this.finished) return;
    this.detach();
    this.props.onCancel();
  };
}
